# Authentication, database and administration setup

The October 19 [customer issue fixes](customer-issue-fixes.md) document the reproduced blank-button defect and current sign-in behavior. Successful password authentication requires a returned session and requests a fresh document, so prefetched guest content is not reused. Missing public configuration displays a credential-free unavailable screen; this fallback is not a substitute for connecting the hosted service.

These are deployment requirements, not evidence that the complete customer journey passes. A free Supabase staging project now has migrations 0001–0009 installed and basic hosted SQL checks passing. An additional hardening migration remains pending after provider request-expiry errors. Vercel access is still blocked by a 403. No real signup, email delivery or payment was verified. See the current [hosted acceptance record](hosted-acceptance.md).

## Connect the existing services

Use the existing Aegis repository and its Vercel project `ai-onboarding-workbench`. Confirm the selected Supabase project belongs to this product before making changes. Keep preview/staging and production data separate. Do not replace a populated database or create an unrelated project to work around missing access.

Set the matching project's `NEXT_PUBLIC_SUPABASE_URL` and public anon/publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the intended Vercel environment. Store `SUPABASE_SERVICE_ROLE_KEY` only as a server secret. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin without a path. Rebuild after public variables change: Next.js embeds them in the browser bundle at build time. Never commit or paste keys into chat, logs or this document.

Back up the database and verify the restore procedure. Apply only unapplied migrations in order, including `20261017162202_hosted_database_hardening.sql` after `0009_database_access.sql`. Migration 0009 explicitly installs table/RPC privileges instead of relying on project defaults. It preserves records and RLS, removes anonymous table access, restricts activity to customer reads, and restricts invitations to validated RPCs. The final migration hardens trigger-function grants and lookup paths, and improves policy/index coverage. Neither adds data or accounts. Adapt integrations that write directly to invitation/activity tables to the supported RPCs first. See the hosted acceptance record before switching the existing staging project's migration deployment method.

## Enable reliable email authentication

1. In Supabase Auth, enable email/password sign-in and new registrations. Require email confirmation. Set the minimum password length to at least eight characters, matching the form; enable additional password protections supported by the chosen plan.
2. Set the Supabase Site URL to the deployment's canonical origin. Allow the exact deployed `/auth/callback` route, including its query parameters, in Redirect URLs. Verify a callback with `?next=/portal` and one with `?next=/reset-password` are accepted. Use a narrowly scoped pattern for the callback query if required by the provider's matcher. Do not broadly allow arbitrary preview domains in production.
3. Configure a custom SMTP sender and the sender domain's provider-required DNS records. Supabase's built-in sender is for testing and has restricted delivery/rate limits. Confirm delivery with test inboxes you control before opening registration. Disable email link tracking that rewrites confirmation links.
4. Apply `supabase/templates/confirmation.html` to **Confirm signup** and `supabase/templates/recovery.html` to **Reset password**. These templates use the `RedirectTo` URL supplied by Aegis, which always contains `/auth/callback?next=...`, then append the token hash and type. Do not use these templates with a separate client that omits that callback query; give that client its own supported template flow.
5. A token-hash link opens `/auth/confirm`; an explicit same-origin form POST to `/auth/verify` exchanges it for a session. A GET/link scanner does not consume it. Recovery always ends at `/reset-password`. Tokens are never logged by application code; configure hosting/observability URL redaction so access logs do not retain authentication query parameters.
6. Existing PKCE code links remain supported by `/auth/callback`. Those links must be completed in the browser that initiated them. The new token-hash templates support another browser/device. Expired/invalid links offer a resend path; confirmation resend is throttled in the UI and subject to provider rate limits.

The app does not send onboarding/invitation emails itself; workspace invitations remain shareable links. SMTP configuration is for Supabase account confirmation and recovery.

## Administration

- `/portal/[orgSlug]/admin`: owner/admin overview with real workspace usage, pending invitations, team management, settings, billing and activity links. The server denies direct access to members and viewers. Owners retain control of billing and access changes.
- `/portal/account`: verified account details, workspace switching, password-reset entry point and current-browser signout.
- `/admin`: operator-only deployment diagnostics. After verifying the operator's email, obtain their UUID from Supabase Auth and add it to the **server-only** `AEGIS_ADMIN_USER_IDS` variable. Use comma-separated UUIDs for multiple operators. Empty means disabled. Neither a workspace owner role nor editable user metadata grants this privilege.
- Operator diagnostics use ordinary authenticated RLS and bounded HEAD requests. They do not return customer records, use a service-role bypass, change plans, modify users or impersonate customers. The provider settings check verifies email signup/confirmation configuration. Passing read probes do not prove writes, RLS policy correctness, email delivery, billing or backups.
- `/api/health` remains a coarse **configuration** signal. It is not an end-to-end database health check. Use operator diagnostics and the acceptance procedure below for deployment verification.

## Hosted acceptance procedure

Use two test inboxes you control and a staging deployment/database. Record deployment SHA, provider project, date and result for each step. No automatic script sends email or creates hosted users as part of `npm test`.

1. Start from a catalogue tool, register, receive the email, confirm in another browser and verify the selected tool survives into onboarding. Open the same email link again: it must offer recovery, not create a second session successfully.
2. Create a workspace. Confirm the owner membership in the database; sign out and sign back in. Refresh the dashboard and confirm the workspace persists.
3. Create an assessment, save a lens, add evidence and update workflow ownership. Refresh and verify the exact saved values and activity events. Check failed saves leave input available for retry.
4. Sign in as a second account. Confirm another workspace's IDs cannot be read or changed through the API. Invite that account as a viewer, verify it can read but cannot write, and verify it cannot open workspace administration. Revoke access and retry the same URLs/API calls.
5. Request a password reset, open it in another browser, set a matching new password, sign out, and confirm that the new password works and the old one fails. Test an expired link and resend. Verify the password form gives a new-link path without a valid session.
6. Allowlist only the operator UUID. Verify that operator can open `/admin` and see live results; a normal workspace owner gets no access. Remove the allowlist entry and verify access disappears.
7. Test on desktop and mobile browsers, including keyboard navigation, pending saves, service outages, signout and direct URLs. Do not infer visual QA from HTTP or jsdom tests.
8. Follow `docs/launch-readiness.md` for Stripe test checkout/webhooks/cancellation, legal identity, customer support and backups. Keep `LAUNCH_APPROVED=false` until the complete hosted journey passes.

## Sources

- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [PKCE browser/device limitation](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Email template variables and token-hash verification](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Production deployment checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Reviewed 17 October 2026. Provider settings must be verified on the connected project.
