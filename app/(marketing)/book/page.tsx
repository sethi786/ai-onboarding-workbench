'use client';

import { useState } from 'react';
import { PageHero } from '@/components/marketing/PageHero';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';

export default function BookPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Book a demo"
        title="See Clearance AI on your AI stack"
        subtitle="A 30-minute walkthrough of the readiness workflow, control tower, and evidence factory."
      />
      <section className="mx-auto max-w-xl px-6 py-16">
        {sent ? (
          <div className="rounded-lg border border-trust/30 bg-trust/10 p-6 text-sm">
            Thanks — we’ll reach out to schedule. (Foundation build: connect this to your scheduling
            provider, e.g. Cal.com, before launch.)
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Your role</Label>
              <Select id="role" defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                <option>CISO / Security</option>
                <option>CIO / CTO / IT</option>
                <option>GRC / Risk / Compliance</option>
                <option>AI Program / Platform</option>
                <option>Other</option>
              </Select>
            </div>
            <Button type="submit" variant="electric" size="lg">
              Request a demo
            </Button>
          </form>
        )}
      </section>
    </>
  );
}
