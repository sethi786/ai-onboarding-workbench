/** Deployment checks expose only booleans, never credential values. */
export function launchChecks() {
  return {
    authentication: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    payments: Boolean(
      process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_TEAM_PRICE_ID &&
        process.env.STRIPE_WEBHOOK_SECRET,
    ),
    serviceAccess: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    contactProtection: Boolean(
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
        process.env.TURNSTILE_SECRET_KEY,
    ),
    identity: Boolean(
      process.env.NEXT_PUBLIC_LEGAL_ENTITY &&
        process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    ),
    domain: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')),
    releaseApproved: process.env.LAUNCH_APPROVED === 'true',
  };
}
export function leadsConfigured() {
  const c = launchChecks();
  return (
    c.authentication && c.serviceAccess && c.contactProtection && c.identity
  );
}
