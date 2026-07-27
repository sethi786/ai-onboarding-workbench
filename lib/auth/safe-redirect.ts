/**
 * Constrain a post-auth `next` target to a same-origin relative path.
 * Blocks `javascript:` URLs, protocol-relative `//host`, and absolute URLs —
 * preventing open-redirect / client-side XSS via a crafted ?next= value.
 */
export function safeNext(next: string | null | undefined, fallback = '/portal'): string {
  if (!next) return fallback;
  // Must be a root-relative path.
  if (!next.startsWith('/')) return fallback;
  // Reject protocol-relative ("//evil.com") and backslash tricks ("/\evil.com").
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  // Reject anything with a scheme (e.g. "/javascript:..." can't have one, but be safe).
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(next)) return fallback;
  return next;
}
