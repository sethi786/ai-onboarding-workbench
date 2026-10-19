# Customer issue fixes — October 19, 2026

Scope: the user's report that login does not work and the site feels unfinished. Repository: `sethi786/ai-onboarding-workbench`, draft PR #7.

## Reproduced defects and changes

| Problem | Change | Evidence |
| --- | --- | --- |
| Login, signup, reset, confirmation resend and password-update actions had blank buttons | Render children in the shared submit button and default its type to submit | Five newly added label tests failed before the fix and pass after it |
| Login navigated without requiring an authenticated session and reused client navigation that can retain prefetched guest content | Require a returned session; use a validated local destination and fresh document navigation after sign-in | Mocked successful/missing-session tests; real hosted cookies still need acceptance |
| Provider errors exposed raw text; every login failure suggested confirmation | Map errors to recovery actions and show confirmation recovery only when required | Invalid credentials, unconfirmed email, rate limit, service failure and retry tests |
| Returned provider outages were treated as ordinary signed-out sessions | Detect returned service errors; preserve intended route/query and refreshed cookies | Middleware regressions including returned HTTP 503 |
| Unconfigured authentication sent visitors to a generic status page | Keep an explicit unavailable screen at account routes, with demo and retry actions and no credential fields | Component test and production HTTP smoke |
| Forms gave little help while pending or entering passwords | Visible pending labels, disabled inputs, password reveal, focused announced errors and larger controls | Interaction tests and type/lint checks; browser accessibility review outstanding |
| Account screens and navigation lacked consistency | New account layout, supporting product context, home/legal/help links, persistent workspace sidebar and scrollable settings tabs | Source review and build; desktop/mobile visual review outstanding |
| Homepage repeated the same demo content and advertised signup when unavailable | Shorter homepage; route major acquisition actions to the interactive demo when public authentication configuration is absent | Public-route smoke and source review |

## Validation boundary

The automated authentication tests use a mocked provider and jsdom. They verify the visible customer actions, request payloads, loading and error states, and navigation decisions. They do not verify live Supabase email delivery, hosted session cookies, or browser rendering.

All 286 automated tests pass. TypeScript, ESLint, the optimized build and HTTP smoke across 85 public routes also pass. The production dependency audit reports zero vulnerabilities. The route check caught two outdated links to the removed homepage demo section; both now open `/demo`, and the repeated check passes. Exact commit CI is recorded in PR #7. Keep the hosted acceptance checklist separate from these code checks.

## Hosted blockers still open

- The supplied preview URL opens Vercel's login page before Aegis. This was observed in the cloud browser; no Aegis authenticated customer journey was completed.
- The Vercel project connector again returned HTTP 403 for `sethi786s-projects/ai-onboarding-workbench`. No mapped local CLI or credentials were available. Current hosted environment variables were not inspected or changed. Deployment success alone does not establish functional authentication.
- Applying `20261017162202_hosted_database_hardening.sql` again returned `Invalid or expired requestState`; a subsequent migration listing confirmed it remains unapplied. Migrations 0001–0009 remain installed in the existing free staging project.
- Provider access, staging configuration, SMTP and email templates, actual signup/login/recovery, and authenticated save/reload/role tests must be completed before claiming that hosted login is fixed.
- Stripe sandbox purchase acceptance and the other [launch gates](hosted-acceptance.md) remain open. No production promotion, customer charge, domain purchase or real outgoing account email was performed during this fix.

Keep `LAUNCH_APPROVED=false`. The unavailable screen prevents a misleading form; it does not make the product ready to sell.
