// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const actions = vi.hoisted(() => ({
  member: vi.fn(),
  rename: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ refresh: actions.refresh }),
  unstable_rethrow: () => {},
}));
vi.mock('@/lib/actions/workspace', () => ({
  changeWorkspaceMember: actions.member,
  renameWorkspace: actions.rename,
}));
vi.mock('@/lib/actions/evaluations', () => ({
  createEvaluation: actions.create,
  updateEvaluation: actions.update,
}));
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { PortfolioList } from '@/components/portal/PortfolioList';
import { MemberAccess } from '@/components/portal/MemberAccess';
import { WorkspaceSettings } from '@/components/portal/WorkspaceSettings';
import {
  UnsavedChanges,
  useDirtyForm,
} from '@/components/portal/UnsavedChanges';
import { EvaluationForm } from '@/components/portal/EvaluationForm';
import type { PortfolioItem } from '@/lib/portfolio';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});
async function input(element: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function select(element: HTMLSelectElement, value: string) {
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
async function click(label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent === label,
  );
  expect(button).toBeDefined();
  await act(async () => button!.click());
}
const item: PortfolioItem = {
  id: '1',
  name: 'Support agent',
  platform: 'Example',
  category: 'AI',
  environment: 'Pilot',
  owner: 'Casey',
  updatedAt: '2026-10-17',
  readiness: 40,
  risk: 'High',
  recommendation: 'Blocked',
  blockers: 2,
  overdue: 1,
  evidence: 30,
  nextAction: 'Resolve the security blocker',
  nextHref: '/portal/test/evaluations/1/lenses',
};

describe('workspace customer interactions', () => {
  it('opens desktop navigation by click and closes it with Escape while restoring focus', async () => {
    await act(async () => root.render(createElement(SiteHeader)));
    const product = container.querySelector<HTMLButtonElement>(
      'button[aria-controls="nav-panel-0"]',
    )!;
    await act(async () => product.click());
    expect(product.getAttribute('aria-expanded')).toBe('true');
    expect(
      container.querySelector<HTMLDivElement>('#nav-panel-0')!.hidden,
    ).toBe(false);
    await act(async () =>
      container
        .querySelector('header')!
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        ),
    );
    expect(product.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(product);
  });
  it('gives mobile buyers an explicit login and demo link', async () => {
    await act(async () => root.render(createElement(SiteHeader)));
    const toggle = container.querySelector<HTMLButtonElement>(
      '[aria-label="Open menu"]',
    )!;
    await act(async () => toggle.click());
    const mobile = container.querySelector<HTMLElement>('#mobile-site-nav')!;
    expect(mobile.hidden).toBe(false);
    expect(mobile.querySelector('a[href="/login"]')).not.toBeNull();
    expect(mobile.querySelector('a[href="/demo"]')).not.toBeNull();
    const demo = mobile.querySelector<HTMLAnchorElement>('a[href="/demo"]')!;
    demo.addEventListener('click', (event) => event.preventDefault());
    await act(async () =>
      demo.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      ),
    );
    expect(mobile.hidden).toBe(true);
  });
  it('combines multi-word search with blocker and owner filters, then clears an empty result', async () => {
    await act(async () =>
      root.render(
        createElement(PortfolioList, {
          items: [
            item,
            {
              ...item,
              id: '2',
              name: 'Coding assistant',
              owner: '',
              blockers: 0,
              overdue: 0,
            },
          ],
          orgSlug: 'test',
        }),
      ),
    );
    await input(container.querySelector('input')!, 'Casey pilot');
    expect(container.querySelectorAll('article')).toHaveLength(1);
    await click('Needs an owner');
    expect(container.textContent).toContain('No evaluations match');
    await click('Clear filters');
    expect(container.querySelectorAll('article')).toHaveLength(2);
    await click('Has blockers');
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(container.querySelector('article')?.textContent).toContain(
      'Support agent',
    );
  });
  it('does not change access until the owner confirms', async () => {
    actions.member.mockResolvedValue({});
    await act(async () =>
      root.render(
        createElement(MemberAccess, {
          orgSlug: 'test',
          id: 'membership',
          email: 'person@example.test',
          currentRole: 'member',
        }),
      ),
    );
    await select(container.querySelector('select')!, 'owner');
    await click('Change role');
    expect(container.textContent).toContain('Owners control billing');
    expect(actions.member).not.toHaveBeenCalled();
    await click('Cancel');
    expect(actions.member).not.toHaveBeenCalled();
    await click('Remove');
    await click('Confirm change');
    expect(actions.member).toHaveBeenCalledExactlyOnceWith(
      'test',
      'membership',
      'remove',
    );
  });
  it('keeps a failed access change visible without pretending the role changed', async () => {
    actions.member.mockRejectedValue(new Error('offline'));
    await act(async () =>
      root.render(
        createElement(MemberAccess, {
          orgSlug: 'test',
          id: 'membership',
          email: 'person@example.test',
          currentRole: 'member',
        }),
      ),
    );
    await click('Remove');
    await click('Confirm change');
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not save',
    );
    expect(actions.refresh).not.toHaveBeenCalled();
  });
  it('retains a workspace name on failure and confirms only successful persistence', async () => {
    actions.rename
      .mockResolvedValueOnce({ error: 'Permission changed' })
      .mockResolvedValueOnce({});
    await act(async () =>
      root.render(
        createElement(WorkspaceSettings, {
          orgSlug: 'test',
          initialName: 'Original',
          editable: true,
        }),
      ),
    );
    await input(container.querySelector('input')!, 'Updated');
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Permission changed',
    );
    expect(container.querySelector('input')!.value).toBe('Updated');
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Unsaved',
    );
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
    );
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'is saved',
    );
  });
  it('does not drop an unfamiliar vendor from the evaluation editor and retains input after a network error', async () => {
    actions.update.mockRejectedValue(new Error('offline'));
    await act(async () =>
      root.render(
        createElement(EvaluationForm, {
          orgId: 'org',
          orgSlug: 'test',
          evalId: 'eval',
          initial: { name: 'My tool', platform: 'My private vendor' },
        }),
      ),
    );
    expect(
      container.querySelector<HTMLInputElement>('input[list]')!.value,
    ).toBe('My private vendor');
    const nameLabel = Array.from(container.querySelectorAll('label')).find(
      (l) => l.textContent === 'Name',
    )!;
    const name = document.getElementById(nameLabel.htmlFor) as HTMLInputElement;
    await input(name, 'Updated tool');
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Your changes are still here',
    );
    expect(name.value).toBe('Updated tool');
  });
});

function DirtyFixture() {
  const [dirty, setDirty] = useState(true);
  useDirtyForm(dirty);
  return createElement(
    'button',
    { onClick: () => setDirty(false) },
    'Save fixture',
  );
}
describe('unsaved work protection', () => {
  it('prompts once for multiple dirty editors and blocks navigation when canceled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await act(async () =>
      root.render(
        createElement(
          UnsavedChanges,
          null,
          createElement(DirtyFixture),
          createElement(DirtyFixture),
          createElement('a', { href: '/somewhere' }, 'Leave'),
        ),
      ),
    );
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    await act(async () => container.querySelector('a')!.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await act(async () =>
      container.querySelectorAll('button').forEach((button) => button.click()),
    );
    const savedUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(savedUnload);
    expect(savedUnload.defaultPrevented).toBe(false);
  });
});
