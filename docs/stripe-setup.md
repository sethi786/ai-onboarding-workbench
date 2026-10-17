# Stripe setup and purchase acceptance

Updated 17 October 2026. The connection exposes the Aegis **live** account only. No account-specific configuration, product, price, webhook, customer or payment has been created through this connection. Sandbox access and hosted payment acceptance remain pending. Automated tests use local fixtures and mocked provider calls.

## Environment and account separation

1. Select the intended Aegis account and grant access to a dedicated Stripe sandbox. Use separate sandbox and live credentials, prices, webhook endpoints and databases. Never connect a sandbox webhook to the production database.
2. Store credentials directly in the deployment's secret settings. Prefer a restricted server key with only the required permissions: Customers read/write; Checkout Sessions read/write; Prices read; Subscriptions read; Invoices read; and Billing Portal Sessions write. Check the permission names in the current Stripe Dashboard and prove all operations with that key. Provision products, prices, portal configuration and endpoints separately using an authorized operator account. No application permission to create refunds, payouts or subscriptions directly is required.
3. Configure `STRIPE_SECRET_KEY`, `STRIPE_TEAM_PRICE_ID`, and the endpoint-specific `STRIPE_WEBHOOK_SECRET`. Both `rk_test_`/`sk_test_` and `rk_live_`/`sk_live_` credentials are supported. Preview/development Vercel deployments reject live keys. Incoming signed events and checkout prices must match the server credential mode. This check supplements, rather than replaces, separate databases and environment scopes.
4. Keep production `LAUNCH_APPROVED=false`. Enable it only in the isolated sandbox deployment for acceptance. Authentication, service access, business identity, HTTPS origin and all billing settings must also be present before checkout opens.

## Product, checkout and portal

- Create one active Team price: **USD 99.00 per workspace, recurring monthly, interval count 1, licensed quantity 1**. The checkout validates these values against application pricing. No annual commitment or trial is configured.
- Set the business name, monitored support details, statement descriptor, terms URL and privacy URL in Stripe. Hosted Checkout collects a billing address and requires agreement to terms. The app uses Stripe's dynamic payment methods; the Dashboard controls which eligible methods appear.
- Configure the customer portal with payment-method updates, invoice history and cancellation at the end of the paid period. Disable product/price switching unless an application change explicitly supports it. Verify the portal return URL against the canonical HTTPS deployment.
- The owner alone can open checkout or the portal. Existing nonterminal subscriptions block another purchase. An open checkout is reused only if its workspace, mode, price, quantity and return URLs match. Multiple or incompatible sessions require operator review before another session can be opened.
- The business is already GST/HST registered. Verify the correct active registration, tax treatment, customer locations and invoice settings in Stripe Tax before enabling `STRIPE_AUTOMATIC_TAX=true`. Registration outside Stripe does not establish that Stripe is configured to collect it. Include applicable tax in the acceptance review; do not charge test purchases to a real card.

## Webhook configuration

Create a **snapshot** destination at `https://<deployment>/api/billing/webhook` with the SDK-compatible API version (`2026-09-30.endive` for the installed Stripe SDK). The endpoint must be reachable by Stripe; a hosting sign-in wall must not intercept deliveries. Keep workspace pages protected by application authentication. Subscribe to exactly these supported events:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
invoice.paid
invoice.payment_failed
invoice.payment_action_required
invoice.finalization_failed
```

Copy the signing secret from that destination directly into server settings. CLI forwarding secrets and other endpoint secrets are not interchangeable. Save secrets without logging them, rebuild where required, and confirm signed delivery and event-ledger persistence.

The handler validates the raw signature and mode, maps the Stripe customer through the database, and retrieves current subscriptions with expanded latest invoices. A callback URL, event name or metadata organization ID never grants access. An active subscription to the exact Team price needs a paid invoice before granting new Team access. Trials, incomplete payments, past-due, unpaid, paused and canceled subscriptions do not grant it. A zero-amount invoice legitimately marked paid can qualify, for example after an operator-approved credit.

An existing Team workspace retains access while an automatic renewal invoice is draft/open, has no payment attempt, and is less than two hours old. This avoids an interruption during Stripe's normal invoice preparation. It never upgrades a free workspace. Failed attempts, manual collection, disabled automatic progression and stale drafts end that allowance on reconciliation. This is an event-driven check, **not a scheduled expiry job**. Alert on invoice finalization failures and stuck drafts; investigate and resend an appropriate event after correction. Add a scheduled reconciler before promising time-bounded recovery from permanently missed webhooks.

Provider or database failures return 500 so Stripe can retry. Unexpanded invoice IDs are treated as failed reads rather than revoking access. The database records processed event IDs and rejects stale observations. Existing Enterprise agreements remain operator-managed. Customer data is retained on downgrade; paid quotas apply to new actions. Refunds are an operator workflow: a refund alone is not subscription cancellation, so resolve the subscription and customer agreement explicitly.

## Acceptance evidence required before sales

Use controlled test identities, synthetic workspace data, Stripe sandbox payment methods and a separate database. Record the deployment commit, event/session/subscription identifiers, response status and resulting plan; never record credentials or card details.

| Journey | Expected result |
| --- | --- |
| Successful monthly payment | Correct price, tax and terms; signed delivery; Team stored in the database; quota changes after refresh |
| Abandoned or canceled checkout | Workspace remains free; retry reuses the compatible session |
| Decline / authentication required | Clear provider recovery path; no Team access before invoice payment |
| Delayed payment | Completed checkout alone leaves free; success grants Team after reconciliation; failure leaves free |
| Double-click / retry / second browser | One payable checkout for the workspace; existing subscription opens management rather than a second purchase |
| Renewal | Paid access survives normal draft preparation; paid renewal retains access; failed payment follows the stated downgrade behavior |
| Cancellation | Portal confirms end-of-period cancellation; access lasts while the current subscription/invoice qualifies; terminal cancellation downgrades without deleting assessments |
| Duplicate / reordered events | No duplicate ledger entry; current provider state wins; a late success URL or stale event cannot grant access |
| Signature / environment mismatch | Forged or opposite-mode event rejected before database access; preview cannot start live billing |
| Provider / database outage | Retryable error and alert; replay after recovery converges to current Stripe state |
| Workspace roles | Member/admin cannot purchase for another owner or workspace; operator can diagnose failures without exposing secrets |

Use Stripe test clocks where supported to advance renewals and cancellation. Monitor unsuccessful webhook deliveries and configure an incident owner before opening sales. After sandbox acceptance, configure separate live resources and repeat deployment checks on the final domain. A real charge is a separate, explicit action; no automated test should charge a live card.

## Primary references

- [SaaS subscription integration](https://docs.stripe.com/get-started/use-cases/saas-subscriptions)
- [Subscription invoices and renewal timing](https://docs.stripe.com/billing/invoices/subscription)
- [Subscription webhook handling](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Webhook signatures, retries and event ordering](https://docs.stripe.com/webhooks)
- [Customer portal](https://docs.stripe.com/customer-management/integrate-customer-portal)
