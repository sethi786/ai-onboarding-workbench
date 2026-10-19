// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
vi.mock('@/lib/actions/templates', () => ({ instantiateTemplate: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ToolCatalogue } from '@/components/catalogue/ToolCatalogue';
import { BillingActions } from '@/components/portal/BillingActions';
import { LeadForm } from '@/components/marketing/LeadForm';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
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
describe('buyer-facing journeys', () => {
  it('searches the catalogue and provides a recoverable empty state', async () => {
    await act(async () => root.render(createElement(ToolCatalogue)));
    expect(container.querySelectorAll('article')).toHaveLength(40);
    await input(container.querySelector('input')!, 'Lovable');
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(container.textContent).toContain('View assessment starter');
    await input(container.querySelector('input')!, 'no-such-vendor');
    expect(container.textContent).toContain('No matching tools');
    await act(async () => container.querySelector('button')!.click());
    expect(container.querySelectorAll('article')).toHaveLength(40);
  });
  it('filters by category without losing clear counts', async () => {
    await act(async () => root.render(createElement(ToolCatalogue)));
    const select = container.querySelector('select')!;
    await act(async () => {
      select.value = 'Meetings';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.querySelectorAll('article')).toHaveLength(2);
    expect(container.querySelector('[aria-live]')?.textContent).toContain(
      '2 of 40',
    );
  });
  it('does not collect an enquiry when the intake service is unavailable', async () => {
    await act(async () =>
      root.render(
        createElement(LeadForm, {
          kind: 'contact',
          enabled: false,
          supportEmail: '',
        }),
      ),
    );
    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toContain('Enquiries open soon');
    expect(container.querySelector('a[href="/tools"]')).not.toBeNull();
  });
  it('keeps billing errors visible and permits retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({ error: 'Payment provider unavailable' }),
        }),
    );
    await act(async () =>
      root.render(
        createElement(BillingActions, {
          orgId: 'org',
          configured: true,
          owner: true,
          customer: false,
          plan: 'free',
        }),
      ),
    );
    await act(async () => container.querySelector('button')!.click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Payment provider unavailable',
    );
    expect(container.querySelector('button')!.disabled).toBe(false);
    vi.unstubAllGlobals();
  });
  it('does not show a purchase button to a non-owner', async () => {
    await act(async () =>
      root.render(
        createElement(BillingActions, {
          orgId: 'org',
          configured: true,
          owner: false,
          customer: true,
          plan: 'team',
        }),
      ),
    );
    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toContain('workspace owner');
  });
  it('does not interpret the checkout return URL as an entitlement upgrade', async () => {
    await act(async () =>
      root.render(
        createElement(BillingActions, {
          orgId: 'org',
          configured: true,
          owner: true,
          customer: true,
          plan: 'free',
          outcome: 'success',
        }),
      ),
    );
    expect(container.textContent).toContain('after payment confirmation');
    expect(container.textContent).not.toContain('Your Team plan is active');
  });
});
