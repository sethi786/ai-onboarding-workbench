# Aegis launch audit and release runbook

Prepared October 17, 2026. Scope: `sethi786/ai-onboarding-workbench`, extending draft PR #7.

**Release decision: ready for hosted acceptance testing; not yet cleared to accept production customers or payments.** Local tests establish code behavior. They do not establish that the hosted database, payment account, email, backups, or legal terms are configured.

## Customer offer

| Plan | Proposed selling price | Included |
| --- | --- | --- |
| Starter | US$0 | 3 stored evaluations, 1 member, all 20 lenses, tool/scenario starters, workflow, evidence links, data/report exports |
| Team | US$99 per workspace/month, plus applicable tax | Unlimited evaluations, 25 members, recorded review decisions, draft evidence packs, invitations, subscription management |
| Enterprise | Written quotation | Larger rollout and scoped requirements; no assumed SSO, SCIM, custom lenses, dedicated hosting, or SLA |

US$99 is an initial positioning choice for the implemented self-assessment product, not a validated market willingness-to-pay result. It replaces an unsupported US$499 offer. Test conversion and retention with the first paying teams before adding annual commitments or more tiers. Stripe price configuration is checked against the displayed currency, amount, and monthly interval before checkout opens. Third-party tool subscriptions are separate and are not included.

## Customer audit: findings and resolutions

| Buyer step | Finding | Release change | Verification boundary |
| --- | --- | --- | --- |
| Understand product | “Already cleared”, certification/alignment language, automatic approval implications | Evidence and readiness positioning; limitations visible; false certifications removed | Source and public-route checks |
| Compare plans | US$499 card, fake free-trial CTA, unimplemented SSO/custom lenses sold as included | One plan definition, US$99 monthly Team, honest feature comparison | Entitlement and checkout tests |
| Explore tools | 20 tools, stale model versions, no public search, “60% complete” assertion | 40 tools, six scenarios, searchable categories, vendor links, neutral scope starters, no prefilled passing scores | Catalogue integrity and UI interaction tests |
| Start an assessment | Selected tool lost at signup | Safe signup/callback/start/onboarding path retains selection | Redirect and generated-link tests; hosted confirmation email still required |
| Contact sales | Contact and demo forms simulated success | Validated database intake, persistent limits, Turnstile, request reference; unavailable form collects nothing | Validation, SQL, public fallback tests; live Turnstile and operator inbox still required |
| Create a workspace | Configuration failure could surface an internal error | Clear preview state when authentication is unavailable | Public HTTP checks |
| Recover password | Signed-in recovery user redirected away from reset page | Recovery pages remain reachable; session cookies preserved on redirects | Middleware regression tests; hosted recovery email still required |
| Invite teammates | “Invitation recorded” with no delivery or acceptance | Owner/admin creates shareable 7-day link, verified email acceptance, revocation, reserved seats | SQL role, expiry, revocation, identity and replay tests |
| Buy Team | No payment connection; owners/admins could update billing columns | Owner-only hosted checkout; signed webhook reconciliation; customer portal; DB billing-field protection | Route tests + real local SQL; actual Stripe test-mode purchase required |
| Avoid double charges | No purchase state | Database checkout lease; existing subscriptions rejected; open checkout reused | Lock, duplicate-subscription, existing-session tests |
| Evaluate/read evidence | Existing reliability issues from earlier PR | Required evidence, expiry, scope reconfirmation, progress vs blockers, explicit save/error state | Existing governance regression suite |
| Export/leave | Free users blocked from exports | CSV, JSON, Markdown exports on every plan; cancellation path; downgrade retains evaluations | Entitlement and billing tests; hosted cancellation required |
| Trust privacy/security | Placeholder operator email and misleading assurances | Actual implementation-based trust page; explicit legal drafts; no invented business identity | Content review; operator/legal review remains a release gate |

The catalogue is a curated first set, not every AI product in existence. Public vendor links are references, not verified security attestations. Templates must be reviewed for edition, region, feature flags, data use, and contract terms. All controls, evidence and decisions start unreviewed.

## Domain research

Vercel domain search on October 17, 2026 returned:

| Domain | Availability at check | Registration | Renewal |
| --- | --- | --- | --- |
| `useaegisgovernance.com` | Available | US$11.25 / 1 year | US$11.25 / 1 year |
| `aigovernancebench.com` | Available | US$11.25 / 1 year | US$11.25 / 1 year |
| `aegisgovernance.ai` | Available | US$160 / 2 years | US$160 / 2 years |
| `aegisgovernance.com` | Unavailable | — | — |
| `aegisreadiness.com` | Unavailable | — | — |

Recommended working option: `useaegisgovernance.com`. No domain was purchased or reserved. Availability, prices, taxes, and renewal terms must be rechecked at purchase. A domain availability result does not establish rights to a brand name. Confirm the business name before spending on branding.

## Infrastructure access found

- GitHub access works; the existing draft PR and its preview deployment can be updated.
- The prior reliability commit's Vercel Git status reports a successful deployment.
- The connected Vercel API returned 403 for `sethi786s-projects`; its team listing was empty. No environment values were retrieved, changed, or exposed.
- Local Supabase public configuration and live payment credentials were absent. No hosted migration, real account creation, payment, customer email, or production promotion was performed.
- Browser buyer-journey QA reached the Vercel sign-in wall on the protected preview; no visual or authenticated hosted flow is claimed as passed.
- Live Vercel configuration requires reconnecting the correct account/team scope. Use the provider's environment settings for secrets; do not paste secrets into chat or commit them.

## Deployment sequence

1. Review the draft PR. Use a preview/staging environment and a separate staging Supabase project.
2. Back up the existing database and verify a restore. Apply migrations `0001` through `0009` in order. On an existing deployment apply only unapplied migrations. `0006` preserves previous assessments as unconfirmed; `0007` enforces billing/seat/evaluation boundaries and adds invitation and commercial tables. `0008` adds activity history, the scoped member directory, and workspace administration protections. `0009` explicitly installs API grants and removes customer access to privileged tables and direct invitation writes. Review duplicate existing Stripe customer IDs before the new unique index. Confirm existing over-quota tenants; records are preserved, new inserts are limited.
3. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`. Verify table grants and RLS on actual PostgREST, not only the SQL editor. Service-role credentials bypass RLS and belong only in trusted handlers.
4. Follow [Authentication setup](authentication-setup.md) for Supabase email confirmation, site URL, callback URLs, supplied cross-device email templates, production SMTP, password protection and signup abuse controls. Provision the operator UUID allowlist and inspect `/admin`. Test deliverability using accounts you own. Do not broaden callback allowlists to arbitrary domains.
5. Configure Stripe **test mode** first: secret key, a recurring USD 99.00/month Team price, and webhook signing secret. The checkout validates the price; changing a price requires changing the central product amount deliberately. In Stripe set business identity, support details, terms and privacy links, statement descriptor, customer-portal cancellation/invoice/payment controls, and tax configuration. Automatic Tax is opt-in via `STRIPE_AUTOMATIC_TAX=true` after account/tax settings are verified.
6. Register the snapshot webhook at `/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.created`, `updated`, `deleted`, `paused`, and `resumed`. Use the endpoint's own signing secret. The handler verifies the raw body, reads current Stripe subscription state, and atomically records the event. The checkout return URL never activates a plan. Failed writes return 500 for retry. Monitor failed deliveries and reconcile missed events before closing an incident.
7. Configure the Turnstile widget with the exact deployment hostname, public site key and server secret. The action is `enquiry`. Requests are saved to `sales_leads`; no email delivery is implied. Assign an operator to review that table in the Supabase dashboard, implement the agreed retention schedule, and check it daily before opening the form.
8. Set the actual `NEXT_PUBLIC_LEGAL_ENTITY`, monitored `NEXT_PUBLIC_SUPPORT_EMAIL`, and HTTPS `NEXT_PUBLIC_SITE_URL`. Finalize the draft terms/privacy pages for the actual business, jurisdiction, hosting region, processors, retention and support arrangements. The repository does not invent these details.
9. In isolated staging, set `LAUNCH_APPROVED=true` to enable the full purchase path and execute the acceptance checklist below. Keep production `LAUNCH_APPROVED=false` until these gates pass. Preview deployments remain noindex. Rebuild after changing public environment values; Next embeds them at build time.
10. After a successful staged release and final domain decision, configure the purchased domain/DNS, HTTPS, canonical site URL, Supabase callback URLs and Turnstile hostname. Repeat signup/recovery/checkout on that domain in the appropriate safe test setup. Promote a verified production build and run the post-launch checks. Do not merge or promote an untested build just to make a URL public.

## Hosted acceptance checklist (must be completed, not assumed)

Use only dedicated test accounts, synthetic assessment data and Stripe test cards during staging.

- [ ] Public homepage, pricing, catalogue, tool details, terms and contact work on desktop and mobile; keyboard navigation and visible focus work.
- [ ] Sign up from a selected tool; receive confirmation email; create workspace; selected starter remains available.
- [ ] Create an assessment, confirm scope, save controls and evidence, reload, export, and independently compare score and report contents.
- [ ] Change data scope; old evidence/assessment confirmation stops counting until explicitly reconfirmed.
- [ ] Viewer cannot mutate; outsider cannot read; member cannot manage billing; admin cannot promote themself; owner cannot alter plan/customer fields through PostgREST.
- [ ] Free fourth evaluation is rejected, including simultaneous requests. Team permits additional evaluations. Seat reservations and concurrent acceptance obey limits.
- [ ] Owner shares a test invitation; matching verified recipient joins; other email, expired and revoked token fail. Replays do not create duplicate membership.
- [ ] Password recovery email returns to the reset page and a new password works.
- [ ] Team checkout uses USD99/month, correct business identity and applicable tax. Canceling checkout does not upgrade. Successful payment does upgrade only after webhook processing.
- [ ] Invalid signature fails; duplicate and reordered events are harmless; provider/database outage triggers retry; no subscription is granted from URL parameters.
- [ ] Customer portal exposes invoice/payment/cancellation options. Cancellation and failed-payment status reconcile to the correct plan without deleting data. Export still works after downgrade.
- [ ] Contact and demo verification succeed; a persisted lead and its reference can be found by the operator. Retry/error paths do not claim receipt. No test emails are sent to unrelated people.
- [ ] Backups, restore drill, production log alerts, webhook failure alerts, incident owner, retention tasks and monitored support inbox are established.
- [ ] Dependency residuals, policies and the final offer are reviewed; checkout launch flag is enabled only on the approved release.

## Verification and remaining limitations

The automated suite covers the scoring engine, real PostgreSQL-compatible migrations/RLS/triggers using PGlite, server actions, signed Stripe webhook verification, mocked provider interactions, request validation, catalogue search, and UI error states. Production-build HTTP smoke tests cover public routes and absent-service behavior. PGlite's minimal Auth stub is not hosted Supabase Auth/PostgREST. Mocked Stripe calls are not a payment-provider acceptance test. Browser visual QA and hosted results must be recorded separately rather than inferred from unit tests.

Prior release verification: **54 public HTTP routes and absent-service paths passed**; **162 automated tests passed**, TypeScript and ESLint passed, and the optimized Next production build passed. Production dependency audit was clean at this check. The development dependency tree retains the previously documented unpatched `braces` advisory through the Next ESLint plugin/fast-glob chain; avoid a force downgrade as a purported fix. Next builds also emit the known Supabase Realtime dynamic-require warning. These are disclosed residuals, not a claim of independent penetration testing.

The CSP blocks external framing and object embeds and restricts network destinations. Static Next rendering currently requires inline scripts/styles; this is not a nonce-only CSP. No append-only independent reviewer-signature audit system, SSO/SCIM, live vendor certification monitoring, external benchmark dataset, or automatic legal compliance determination is implemented or sold as included.

## Primary integration references

- Stripe webhook signatures, raw-body verification and delivery behavior: https://docs.stripe.com/webhooks
- Stripe Checkout Sessions: https://docs.stripe.com/api/checkout/sessions
- Stripe customer portal: https://docs.stripe.com/customer-management/integrate-customer-portal
- Cloudflare Turnstile server verification: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Catalogue references are stored per tool in `data/tool-templates.ts` and linked on each tool page.

## Functionality and presentation hardening — October 17, 2026

The next release candidate adds the following implemented behavior:

- A focused, server-rendered homepage with an explicitly fictional product preview, concise navigation, a separate `/demo` route, a brand icon, and content that remains visible before animation JavaScript runs.
- Click/keyboard-operated public navigation, Escape-to-close behavior, a native modal mobile workspace drawer, skip links, focus outlines, reduced-motion preferences, and phone-sized workflow/decision editing records. Browser visual acceptance remains outstanding.
- Portfolio text search (tool, vendor, owner, environment), blocker/overdue/unassigned/ready filters, sorting, incremental rendering, and a prioritized next-action dashboard. Scores use the same engine as each assessment. Tenant-scoped paged database reads avoid per-evaluation query waterfalls and default provider row truncation.
- Workspace name editing for owners/admins. The app keeps the existing workspace URL. A scoped database RPC resolves member emails only for workspace managers. Owners can change roles or remove other members, with explicit UI confirmation; the database continues to enforce the final-owner rule.
- Database-generated activity history for evaluations, review answers, evidence references, workflow changes, generated reports, invitations, member access and workspace changes. Events omit private field values. Historical changes are not backfilled. Application users cannot forge, modify or delete events; authorized database operators retain administrative/retention access. This does not constitute independently signed review approval.
- Review recency updates without changing the evaluated scope. Direct customer deletion of a workspace with Stripe billing history is blocked so billing cannot be orphaned; cancellation and operator-assisted deletion must be coordinated.
- Shared protection against losing unsaved review edits when following workspace links, switching workspaces, or closing/reloading a tab. Browser back/forward navigation is not intercepted by Next App Router; save work before using it. No browser storage of confidential draft contents was added.
- The evaluation editor retains custom vendor names, labels its inputs, supports form submission, and preserves edits on a transport failure.
- Clean production builds clear generated `.next` output, including a stale route cache observed serving the previous homepage after a rebuild. CI HTTP checks validate the served version and crawl public links and section targets.

### Verification of this pass

The local full suite passed **196 tests**, including new database history/privacy/access checks, real-engine portfolio parity, pagination past the provider page boundary, member-change confirmation, error recovery, navigation, and unsaved-work behavior. TypeScript, ESLint and the optimized build passed. Production dependency audit returned **0 vulnerabilities**. The final clean production build passed **84 public routes and 3 section links**, plus signup-intent, absent-service, preview-indexing, security-header and 404 checks. Remote CI results are attached to the pull request after the push.

These are automated/HTTP checks, not desktop/mobile browser screenshots or hosted account/payment acceptance. The connected Vercel API again returned **403 for `sethi786s-projects`**. No Vercel CLI is installed in this workspace. No provider secrets were requested or read, no live database migrations were applied, and no payments or emails were sent. The existing preview remains protected.

Before enabling paid production, apply migration 0008 after 0007 in the staging database and verify member management, activity visibility, and retained metadata after deletion through hosted Supabase/PostgREST. Add the activity metadata to the finalized retention policy and verify phone/desktop rendering. The previously listed live auth, Stripe, email, Turnstile, domain, backup/monitoring, and legal-identity gates remain in force.

## Authentication, database installation and administration follow-up

The customer reported that the site was not working reliably. Hosted diagnosis was attempted again: Vercel returned **403 for the existing `sethi786s-projects` project**; no Vercel CLI credentials, Supabase environment values, or live database connection were available in the workspace. A Supabase connection option was identified for the operator. These results do not establish whether the deployed database is empty, outdated, paused, or incorrectly configured; that remains unverified.

Implemented changes:

- Cross-device signup/recovery token-hash handling with supplied email templates, an explicit confirmation POST so a GET/link scanner does not consume tokens, safe return paths, and recoverable expiry/provider-error pages. Existing PKCE remains supported. **Supabase must be configured with these templates and a working sender before the cross-device behavior can be accepted live.**
- Confirmation resend, validated password-reset entry, matching-password confirmation, and visible success/error states. Account and workspace responses explicitly avoid shared caching; public marketing requests no longer depend on Supabase session refresh.
- A real UI regression found during testing: failed React form actions reset uncontrolled workspace-name input. Workspace creation now retains the controlled name. Invitations also retain email and role after failure and identify the intended recipient beside the generated link.
- `/portal/account` for account/security navigation, `/portal/[orgSlug]/admin` for authorized workspace administration, and `/admin` for server-allowlisted operators. An ordinary workspace owner cannot grant themselves operator access. Operator checks use the caller's RLS session, return no customer records or secrets, and keep environment presence separate from live verification.
- Database failures during workspace resolution now produce a retryable error instead of a misleading not-found page.
- Migration `0009_database_access.sql` supplies explicit application table and RPC privileges. A separate fresh-install suite runs migrations without supplying blanket grants, then checks workspace creation, persistence, workflow seeding, tenant isolation, restricted writes, and service-only operations. The existing adversarial SQL suite still checks RLS even if overly broad grants are present.

See `docs/authentication-setup.md` for the exact deployment sequence and hosted acceptance procedure. These changes do not configure provider accounts by themselves. No hosted migration, email, payment, production promotion, or live customer sign-up was performed in this follow-up.

Local verification for this follow-up: the full **230-test suite** passed; after the final invitation-form correction, all **6 account UI tests** passed (including one newly added regression). TypeScript, ESLint, the optimized production build, and **85 public HTTP routes plus 3 section links** passed. The production dependency audit reported **0 vulnerabilities**. HTTP checks also cover missing-service redirects, auth response cache/referrer headers, rejected cross-origin token submission, and the non-consuming GET boundary. The known Supabase Realtime build warning remains. Hosted service acceptance and visual browser QA remain outstanding; these results must not be presented as a successful live buyer journey.
