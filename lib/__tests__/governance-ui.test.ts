// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LensCard } from '../../components/portal/LensCard';
import { LENS_BY_ID, TEAM_LENSES } from '../../workbench/data/teamLenses';
import { computeScoreFromMap } from '../../workbench/engine/scoring';
import { baseProfile, allFull } from '../../workbench/engine/__tests__/fixtures';

const actions = vi.hoisted(() => ({ update: vi.fn(), add: vi.fn(), remove: vi.fn(), confirm: vi.fn() }));
vi.mock('@/lib/actions/assessments', () => ({ updateAssessment: actions.update, addEvidenceLink: actions.add, removeEvidenceLink: actions.remove, confirmAssessmentScope: actions.confirm }));
let root: Root, container: HTMLDivElement;
const assessment = allFull()['security-sar'];
const teamScore = computeScoreFromMap(baseProfile(), TEAM_LENSES, allFull()).perTeam['security-sar'];

beforeEach(async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  actions.update.mockResolvedValue({});
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(LensCard, { lens: LENS_BY_ID['security-sar'], assessment, teamScore, evalId: 'eval', orgId: 'org', orgSlug: 'workspace', canEdit: true, defaultOpen: true, scopeRevision: 1 })));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

async function input(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function saveButton() { return Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Save assessment')!; }

describe('assessment save flow', () => {
  it('saves rapid edits to different fields together instead of losing earlier notes', async () => {
    const notes = container.querySelectorAll('textarea');
    await input(notes[0], 'Security review notes');
    await input(notes[1], 'Residual risk to review');
    expect(actions.update).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Unsaved changes');
    await act(async () => saveButton().click());
    expect(actions.update).toHaveBeenCalledTimes(1);
    expect(actions.update.mock.calls[0][4]).toMatchObject({ notes: 'Security review notes', residualRisk: 'Residual risk to review' });
    expect(actions.update.mock.calls[0][4]).not.toHaveProperty('scopeRevision');
  });
  it('keeps failed edits available for retry and never claims success', async () => {
    actions.update.mockResolvedValue({ error: 'Permission changed' });
    await input(container.querySelector('textarea')!, 'Keep this unsaved note');
    await act(async () => saveButton().click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Permission changed');
    expect(container.querySelector('textarea')?.value).toBe('Keep this unsaved note');
    expect(container.textContent).toContain('Unsaved changes');
    expect(saveButton().disabled).toBe(false);
  });
  it('catches transport errors and permits retry', async () => {
    actions.update.mockRejectedValue(new Error('network unavailable'));
    await input(container.querySelector('textarea')!, 'Retry me');
    await act(async () => saveButton().click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Check your connection');
    expect(saveButton().disabled).toBe(false);
  });
});
