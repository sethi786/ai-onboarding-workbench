// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
const auth = vi.hoisted(() => ({
  update: vi.fn(),
  resend: vi.fn(),
  createOrg: vi.fn(),
  invite: vi.fn(),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { updateUser: auth.update, resend: auth.resend },
  }),
}));
vi.mock('@/lib/actions/organizations', () => ({
  createOrganization: auth.createOrg,
  inviteMember: auth.invite,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams('next=/portal/start?template=lovable'),
  unstable_rethrow: () => {},
}));
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import ResendConfirmation from '@/app/(auth)/resend-confirmation/page';
import { CreateOrgForm } from '@/components/portal/CreateOrgForm';
import { InviteMemberForm } from '@/components/portal/InviteMemberForm';
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  auth.update.mockReset().mockResolvedValue({ error: null });
  auth.resend.mockReset().mockResolvedValue({ error: null });
  auth.invite.mockReset().mockResolvedValue({ error: 'Seat limit reached' });
  auth.createOrg
    .mockReset()
    .mockResolvedValue({ error: 'Database unavailable' });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
async function input(selector: string, value: string) {
  await act(async () => {
    const element = container.querySelector<HTMLInputElement>(selector)!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() {
  await act(async () => {
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}
it('does not submit mismatched passwords and announces the error', async () => {
  await act(async () => root.render(createElement(ResetPasswordForm)));
  await input('#password', 'A test password');
  await input('#confirm-password', 'Different password');
  await submit();
  expect(auth.update).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    'don’t match',
  );
});
it('keeps password inputs on a connection failure and permits a successful retry', async () => {
  auth.update.mockRejectedValueOnce(new Error('network'));
  await act(async () => root.render(createElement(ResetPasswordForm)));
  await input('#password', 'A test password');
  await input('#confirm-password', 'A test password');
  await submit();
  expect(container.querySelector<HTMLInputElement>('#password')!.value).toBe(
    'A test password',
  );
  expect(container.querySelector('button')!.disabled).toBe(false);
  await submit();
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    'new password',
  );
  expect(container.querySelector('input[type="password"]')).toBeNull();
});
it('resends confirmation with preserved intent and prevents immediate duplicate requests', async () => {
  await act(async () => root.render(createElement(ResendConfirmation)));
  await input('#email', 'buyer@example.test');
  await submit();
  expect(auth.resend).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'signup',
      email: 'buyer@example.test',
      options: {
        emailRedirectTo: expect.stringContaining('template%3Dlovable'),
      },
    }),
  );
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    'unconfirmed account',
  );
  expect(container.querySelector('button')!.disabled).toBe(true);
});
it('makes resend provider failures visible and recoverable', async () => {
  auth.resend.mockRejectedValue(new Error('network'));
  await act(async () => root.render(createElement(ResendConfirmation)));
  await input('#email', 'buyer@example.test');
  await submit();
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(container.querySelector('button')!.disabled).toBe(false);
});
it('retains the invited email and role when the invitation fails', async () => {
  await act(async () =>
    root.render(createElement(InviteMemberForm, { orgId: 'example' })),
  );
  await input('#invite-email', 'teammate@example.test');
  await act(async () => {
    const select = container.querySelector('select')!;
    select.value = 'viewer';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    'Seat limit',
  );
  expect(
    container.querySelector<HTMLInputElement>('#invite-email')!.value,
  ).toBe('teammate@example.test');
  expect(container.querySelector('select')!.value).toBe('viewer');
});
it('preserves workspace creation details when the server action fails', async () => {
  auth.createOrg.mockRejectedValue(new Error('network'));
  await act(async () => root.render(createElement(CreateOrgForm)));
  await input('#name', 'My workspace');
  await submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    'details are still here',
  );
  expect(container.querySelector<HTMLInputElement>('#name')!.value).toBe(
    'My workspace',
  );
});
