'use client';
import { useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (id: string) => void;
    };
  }
}
export function LeadForm({
  kind,
  enabled,
  supportEmail,
}: {
  kind: 'contact' | 'demo';
  enabled: boolean;
  supportEmail: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [token, setToken] = useState('');
  const captcha = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  function renderCaptcha() {
    if (captcha.current && window.turnstile && widget.current === null)
      widget.current = window.turnstile.render(captcha.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        action: 'enquiry',
        callback: (value: string) => setToken(value),
        'expired-callback': () => setToken(''),
        'error-callback': () => {
          setToken('');
          setError('Verification could not load. Please retry.');
        },
      });
  }
  if (!enabled)
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold">Enquiries open soon</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          We’re preparing Aegis for launch. Explore the sample assessment and
          tool catalogue while we finish setup.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <Link className="text-electric underline" href="/#demo">
            Try the demo
          </Link>
          <Link className="text-electric underline" href="/tools">
            Browse tools
          </Link>
          {supportEmail && (
            <a
              className="text-electric underline"
              href={`mailto:${supportEmail}`}
            >
              Email us
            </a>
          )}
        </div>
      </div>
    );
  if (reference)
    return (
      <div
        role="status"
        className="rounded-2xl border border-trust/30 bg-trust/10 p-8"
      >
        <h2 className="text-xl font-semibold">Request received</h2>
        <p className="mt-3">
          Your {kind === 'demo' ? 'demo request' : 'enquiry'} has been saved for
          our team.
        </p>
        <p className="mt-3 text-xs break-all">Reference: {reference}</p>
      </div>
    );
  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        setPending(true);
        const data = new FormData(event.currentTarget);
        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...Object.fromEntries(data), kind, token }),
          });
          const result = await response.json();
          if (!response.ok || !result.reference) {
            setError(result.error || 'Could not submit your request.');
          } else {
            setReference(result.reference);
          }
        } catch {
          setError('Connection interrupted. Please retry.');
        } finally {
          setPending(false);
          setToken('');
          if (widget.current) window.turnstile?.reset(widget.current);
        }
      }}
    >
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="lead-name">Name</Label>
        <Input
          id="lead-name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="lead-email">Work email</Label>
        <Input
          id="lead-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="lead-company">Organization (optional)</Label>
        <Input
          id="lead-company"
          name="company"
          maxLength={150}
          autoComplete="organization"
        />
      </div>
      <div>
        <Label htmlFor="lead-message">What would you like help with?</Label>
        <textarea
          id="lead-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          className="w-full rounded-lg border border-border bg-background p-3 text-sm"
        />
      </div>
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">
        We use these details to respond to your request. Please don’t include
        credentials or sensitive assessment data.{' '}
        <Link href="/privacy" className="underline">
          Privacy notice
        </Link>
      </p>
      <div ref={captcha} />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={renderCaptcha}
        onError={() => setError('Verification could not load. Please retry.')}
      />
      <Button type="submit" variant="electric" disabled={pending || !token}>
        {pending
          ? 'Submitting…'
          : kind === 'demo'
            ? 'Request a demo'
            : 'Send enquiry'}
      </Button>
    </form>
  );
}
