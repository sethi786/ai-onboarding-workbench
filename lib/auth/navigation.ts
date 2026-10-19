import { safeNext } from './safe-redirect';

/** Request a fresh document with the new session, avoiding prefetched guest pages. */
export function navigateAfterSignIn(destination: string) {
  window.location.replace(safeNext(destination));
}
