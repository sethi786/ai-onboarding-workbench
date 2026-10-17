# Hosted setup and acceptance record

Updated 17 October 2026. Product: Aegis. Repository: `sethi786/ai-onboarding-workbench`.

**Release decision: do not enable paid production yet.** Staging database installation and basic hosted SQL checks pass. The website is not connected to this project; browser/email/payment acceptance remains outstanding.

## Staging project

- `aegis-staging`, reference `evkhvexadytnwvvousou`: [Supabase dashboard](https://supabase.com/dashboard/project/evkhvexadytnwvvousou).
- Organization `ygsfbaavkhymszkecpxo`; region `ca-central-1`; status `ACTIVE_HEALTHY`; PostgreSQL 17.11.
- Creation quote: $0/month on the Free organization. No paid upgrade or domain purchase. This is staging, not a production availability or backup commitment.
- Installed repository migrations: `0001_init` through `0009_database_access`.
- Loaded 40 active tool templates from the canonical source. They are assessment starters, not vendor certifications. Six scenario starters remain in application source.

MCP records its own timestamp versions. Match migration **names and SQL** against repository files before applying anything. Reconcile migration history with supported CLI tooling before switching to `db push`; blindly pushing the old numbered files could attempt to reinstall them.

## Verified on the hosted project

| Check | Result | Boundary |
| --- | --- | --- |
| Schema | 13 application tables, all with RLS enabled | Presence alone does not prove isolation |
| Auth settings over HTTPS | Email/signup enabled; auto-confirm disabled | No real signup or mail delivery |
| Anonymous PostgREST | Evaluation and sales-lead reads return HTTP 401 | No authenticated browser/JWT flow |
| Workspace setup | Organization RPC creates owner membership | Transaction-scoped test identity |
| Save/read | Assessment/evidence inserts and assessment update read back | SQL transaction only |
| Workflow | Exactly 25 stages created atomically | SQL transaction only |
| History/privileges | History generated; customer cannot insert history, truncate evaluations, or call billing RPC | Installed privileges checked |
| Tenant isolation | Another authenticated identity sees no tenant records in the tested tables | SQL roles/claims, not real login |
| Cleanup | Zero test users/workspaces remain | Entire test transaction rolled back |

## Audit findings and pending fix

`20261017162202_hosted_database_hardening.sql` is locally verified but **not installed**. Two application attempts returned `McpServerError: Invalid or expired requestState`. Migration history subsequently confirmed absence. Do not mark hosted findings resolved until application and re-audit succeed.

The migration fixes two function lookup paths ([guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)); revokes inherited client invocation privileges on internal trigger functions, including direct Supabase `anon` grants ([guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)); splits write policies to avoid duplicated SELECT checks while preserving tenant/role predicates ([guidance](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)); and adds eight foreign-key indexes ([guidance](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)). Revocation does not prevent installed triggers from running.

The seven authorized application RPCs/helpers intentionally remain callable by authenticated users and retain identity/input/role checks ([security-definer review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)). Three service-only tables intentionally have RLS with no customer policies ([deny-by-default guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Unused-index notices on an empty project are not grounds to remove indexes ([guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)).

Local validation: all 270 automated tests passed, including 43 database tests and regressions reproducing Supabase default function grants and checking viewer boundaries across all four assessment child tables. Existing CRUD/trigger tests also run with the hardened privileges. The latest billing tests cover paid invoice evidence, delayed payments, renewal preparation, compatible session reuse, and sandbox/live isolation. This does not change the hosted migration's pending status or establish provider purchase acceptance.

TypeScript, ESLint, the optimized production build, and HTTP smoke checks across 85 public routes and three section links also passed. The production dependency audit found zero vulnerabilities. The build retains the previously documented Supabase Realtime dynamic-require warning. Browser visual and authenticated customer acceptance remain outstanding.

## Stripe connection

The Stripe connection lists the Aegis account in live mode. No sandbox is shared with the connection yet, and no account-specific settings or billing resources have been changed. The code now reconciles invoice and delayed-payment events and requires paid invoice evidence for a new Team entitlement. Preview/development deployments reject live keys. Follow [Stripe setup and purchase acceptance](stripe-setup.md) to grant sandbox access, configure resources and verify the hosted buyer journey.

## Remaining launch gates

1. Apply pending hardening and rerun hosted SQL checks and both advisors.
2. Restore Vercel access to `sethi786s-projects/ai-onboarding-workbench`; the last read returned 403. No hosting variables have changed. Set staging URL/public key/server secret in preview, configure its canonical URL, keep `LAUNCH_APPROVED=false`, and rebuild. Do not paste secrets into chat.
3. Configure custom SMTP, sender DNS, callbacks, supplied email templates, and verified operator UUID. New Free projects cannot customize templates with the default sender ([provider change](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier)). Follow [authentication setup](authentication-setup.md).
4. Test real signup, cross-device confirmation, login/logout, recovery, saved assessments, invitations, viewer restrictions, and operator access using controlled inboxes. Test desktop/mobile, keyboard navigation and failed requests.
5. Grant access to the intended Stripe sandbox and test checkout → verified webhook → Team access → cancellation, including delayed/failed payments and duplicate/reordered webhooks. Follow [the payment setup checklist](stripe-setup.md). A return URL never establishes payment success.
6. Configure Turnstile/enquiry monitoring; finalize business identity/support/legal text; select domain and production plans with approval of nonzero costs; verify backups/restoration, alerts and retention.
7. Run a small pilot and repeat acceptance on the final domain before enabling paid checkout.

See the [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) and [launch runbook](launch-readiness.md). Deployment and unit-test success do not establish production readiness or product-market fit.
