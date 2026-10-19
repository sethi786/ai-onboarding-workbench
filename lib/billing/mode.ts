/** Infer mode from server credentials; never expose their values to clients. */
export function stripeLiveMode(
  key = process.env.STRIPE_SECRET_KEY,
): boolean | null {
  const mode = /^(?:sk|rk)_(test|live)_\S+$/.exec(key || '')?.[1];
  return mode ? mode === 'live' : null;
}

export function stripeEnvironmentAllowed() {
  const live = stripeLiveMode();
  return (
    live !== null &&
    !(live && ['preview', 'development'].includes(process.env.VERCEL_ENV || ''))
  );
}
