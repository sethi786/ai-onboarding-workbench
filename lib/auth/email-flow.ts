import { safeNext } from './safe-redirect';

export function emailRedirect(origin: string, next: string) {
  const url = new URL('/auth/callback', origin);
  url.searchParams.set('next', safeNext(next));
  return url.toString();
}

export function emailVerification(input: {
  token_hash?: unknown;
  type?: unknown;
  next?: unknown;
}) {
  if (
    typeof input.token_hash !== 'string' ||
    !/^[A-Za-z0-9_-]{20,512}$/.test(input.token_hash) ||
    !['email', 'signup', 'recovery'].includes(String(input.type))
  )
    return null;
  const type = input.type as 'email' | 'signup' | 'recovery';
  return {
    token_hash: input.token_hash,
    type,
    next:
      type === 'recovery'
        ? '/reset-password'
        : safeNext(typeof input.next === 'string' ? input.next : null),
  };
}
