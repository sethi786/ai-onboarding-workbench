'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PLANS } from '@/lib/plans';
import { Button } from '@/components/ui/button';
export function BillingActions({
  orgId,
  configured,
  owner,
  customer,
  plan,
  outcome,
}: {
  orgId: string;
  configured: boolean;
  owner: boolean;
  customer: boolean;
  plan: string;
  outcome?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function open(mode: 'checkout' | 'portal') {
    setPending(true);
    setError('');
    try {
      const response = await fetch(`/api/billing/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const body = await response.json();
      if (!response.ok || !body.url) {
        setError(body.error || 'Could not open billing.');
        return;
      }
      const destination = new URL(body.url);
      if (
        destination.protocol !== 'https:' ||
        !['checkout.stripe.com', 'billing.stripe.com'].includes(
          destination.hostname,
        )
      )
        throw new Error('Unexpected checkout URL');
      window.location.assign(destination.href);
    } catch {
      setError('Could not connect to billing. Please retry.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-4">
      {outcome === 'success' && (
        <div role="status" className="rounded-lg bg-muted p-4 text-sm">
          {plan === 'team'
            ? 'Your Team plan is active.'
            : 'Checkout returned successfully. Your plan updates after payment confirmation. Refresh in a moment; do not start another purchase.'}
          <button
            type="button"
            className="ml-2 text-electric underline"
            onClick={() => router.refresh()}
          >
            Refresh plan
          </button>
        </div>
      )}
      {outcome === 'canceled' && (
        <p role="status" className="text-sm">
          Checkout was canceled. Your plan has not changed.
        </p>
      )}
      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Paid upgrades are not open on this deployment yet. Your existing
          workspace remains available.{' '}
          <Link className="text-electric underline" href="/contact">
            Contact us
          </Link>
        </p>
      ) : !owner ? (
        <p className="text-sm text-muted-foreground">
          Ask your workspace owner to manage the subscription.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {plan === 'free' && (
            <Button disabled={pending} onClick={() => open('checkout')}>
              Upgrade to Team · {PLANS.team.price}
            </Button>
          )}
          {customer && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => open('portal')}
            >
              Manage billing & cancellation
            </Button>
          )}
          {plan === 'enterprise' && (
            <Link href="/contact" className="text-electric underline">
              Contact us about your agreement
            </Link>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        USD per workspace, billed monthly. Applicable taxes are shown at
        checkout. Cancel in billing management; access continues through the
        paid period. An unpaid or canceled subscription returns to Starter
        limits without deleting existing assessments.
      </p>
    </div>
  );
}
