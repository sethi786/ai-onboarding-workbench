// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
const auth = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  reset: vi.fn(),
  resend: vi.fn(),
  update: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock('@/lib/auth/navigation', () => ({
  navigateAfterSignIn: auth.navigate,
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: auth.login,
      signUp: auth.signup,
      resetPasswordForEmail: auth.reset,
      resend: auth.resend,
      updateUser: auth.update,
    },
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams('next=/portal/start?template=lovable'),
}));
import Login from '@/app/(auth)/login/page';
import Signup from '@/app/(auth)/signup/page';
import ForgotPassword from '@/app/(auth)/forgot-password/page';
import ResendConfirmation from '@/app/(auth)/resend-confirmation/page';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { AccountUnavailable } from '@/components/auth/AccountUnavailable';

let root: Root, container: HTMLDivElement;
beforeEach(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
  auth.login.mockReset().mockResolvedValue({
    data: { session: { user: { id: 'test-user' } } },
    error: null,
  });
  auth.signup
    .mockReset()
    .mockResolvedValue({ data: { session: null }, error: null });
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
async function clickSubmit(label: string) {
  const button = [
    ...container.querySelectorAll<HTMLButtonElement>('form button'),
  ].find((element) => element.textContent === label);
  expect(button).toBeDefined();
  await act(async () => button!.click());
}
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
it.each([
  { Page: Login, label: 'Log in' },
  { Page: Signup, label: 'Create account' },
  { Page: ForgotPassword, label: 'Send reset link' },
  { Page: ResendConfirmation, label: 'Send confirmation link' },
  { Page: ResetPasswordForm, label: 'Update password' },
])(
  'renders an identifiable "$label" submit button',
  async ({ Page, label }) => {
    await act(async () => root.render(createElement(Page)));
    const button = [...container.querySelectorAll('form button')].find(
      (element) => element.textContent === label,
    );
    expect(
      button,
      'Customers must be able to identify the primary action',
    ).toBeDefined();
    expect((button as HTMLButtonElement).type).toBe('submit');
  },
);
it('signs in through the labelled button and opens a fresh authenticated destination', async () => {
  await act(async () => root.render(createElement(Login)));
  await input('#email', 'buyer@example.test');
  await input('#password', 'A test password');
  await clickSubmit('Log in');
  expect(auth.login).toHaveBeenCalledWith({
    email: 'buyer@example.test',
    password: 'A test password',
  });
  expect(auth.navigate).toHaveBeenCalledWith('/portal/start?template=lovable');
});
it('announces progress and locks credentials while sign-in is pending', async () => {
  let finish!: (value: unknown) => void;
  auth.login.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await act(async () => root.render(createElement(Login)));
  await input('#email', 'buyer@example.test');
  await input('#password', 'A test password');
  await clickSubmit('Log in');
  expect(container.querySelector('form')?.getAttribute('aria-busy')).toBe(
    'true',
  );
  expect(
    container.querySelector<HTMLButtonElement>('button[type="submit"]')
      ?.textContent,
  ).toBe('Signing in…');
  expect(container.querySelector<HTMLInputElement>('#email')?.disabled).toBe(
    true,
  );
  expect(container.querySelector<HTMLInputElement>('#password')?.disabled).toBe(
    true,
  );
  await act(async () =>
    finish({ data: { session: null }, error: { code: 'invalid_credentials' } }),
  );
  expect(container.querySelector('form')?.getAttribute('aria-busy')).toBe(
    'false',
  );
  expect(container.querySelector<HTMLInputElement>('#email')?.disabled).toBe(
    false,
  );
});
it.each([
  {
    error: { code: 'over_request_rate_limit', status: 429 },
    message: 'wait a minute',
  },
  {
    error: { code: 'unexpected_failure', status: 503 },
    message: 'temporarily unavailable',
  },
])(
  'gives a useful recovery message for $error.code',
  async ({ error, message }) => {
    auth.login.mockResolvedValue({ data: { session: null }, error });
    await act(async () => root.render(createElement(Login)));
    await input('#email', 'buyer@example.test');
    await input('#password', 'A test password');
    await clickSubmit('Log in');
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      message,
    );
    expect(auth.navigate).not.toHaveBeenCalled();
  },
);
it('retains credentials and focuses a useful error after an unsuccessful sign-in', async () => {
  auth.login.mockResolvedValueOnce({
    data: { session: null },
    error: { code: 'invalid_credentials', message: 'provider-internal-detail' },
  });
  await act(async () => root.render(createElement(Login)));
  await input('#email', 'buyer@example.test');
  await input('#password', 'A test password');
  await clickSubmit('Log in');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    'email or password is incorrect',
  );
  expect(document.activeElement).toBe(
    container.querySelector('[role="alert"]'),
  );
  expect(container.textContent).not.toContain('provider-internal-detail');
  expect(container.querySelector('a[href^="/resend-confirmation"]')).toBeNull();
  expect(container.querySelector<HTMLInputElement>('#email')?.value).toBe(
    'buyer@example.test',
  );
  expect(container.querySelector<HTMLInputElement>('#password')?.value).toBe(
    'A test password',
  );
  expect(auth.navigate).not.toHaveBeenCalled();
  await clickSubmit('Log in');
  expect(auth.navigate).toHaveBeenCalledOnce();
});
it('offers confirmation recovery only when the provider requires it', async () => {
  auth.login.mockResolvedValue({
    data: { session: null },
    error: { code: 'email_not_confirmed' },
  });
  await act(async () => root.render(createElement(Login)));
  await input('#email', 'buyer@example.test');
  await input('#password', 'A test password');
  await clickSubmit('Log in');
  expect(
    container.querySelector('a[href^="/resend-confirmation"]'),
  ).not.toBeNull();
  expect(auth.navigate).not.toHaveBeenCalled();
});
it('does not navigate on an empty or failed session response', async () => {
  auth.login.mockResolvedValue({ data: { session: null }, error: null });
  await act(async () => root.render(createElement(Login)));
  await input('#email', 'buyer@example.test');
  await input('#password', 'A test password');
  await clickSubmit('Log in');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain(
    'start your session',
  );
  expect(auth.navigate).not.toHaveBeenCalled();
});
it('shows and hides the password without submitting the form', async () => {
  await act(async () => root.render(createElement(Login)));
  await input('#password', 'A test password');
  const toggle = container.querySelector<HTMLButtonElement>(
    '[aria-label="Show password"]',
  )!;
  await act(async () => toggle.click());
  expect(container.querySelector<HTMLInputElement>('#password')?.type).toBe(
    'text',
  );
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  await act(async () => toggle.click());
  expect(container.querySelector<HTMLInputElement>('#password')?.type).toBe(
    'password',
  );
  expect(auth.login).not.toHaveBeenCalled();
});
it('keeps signup on the confirmation screen until a session exists', async () => {
  await act(async () => root.render(createElement(Signup)));
  await input('#email', 'buyer@example.test');
  await input('#password', 'A test password');
  await clickSubmit('Create account');
  expect(container.textContent).toContain('Check your email');
  expect(auth.signup).toHaveBeenCalledOnce();
  expect(auth.navigate).not.toHaveBeenCalled();
});
it('provides a useful unavailable state without collecting credentials', async () => {
  await act(async () => root.render(createElement(AccountUnavailable)));
  expect(container.textContent).toContain(
    'Account access is temporarily unavailable.',
  );
  expect(container.querySelector('form')).toBeNull();
  expect(container.querySelector('input')).toBeNull();
  expect(container.querySelector('a[href="/demo"]')).not.toBeNull();
});
