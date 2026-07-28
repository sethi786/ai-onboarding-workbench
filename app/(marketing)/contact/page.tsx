'use client';

import { useState } from 'react';
import { PageHero } from '@/components/marketing/PageHero';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to us about your review process"
        subtitle="Tell us what you’re adopting and where the review is stuck — we’ll get back within one business day."
      />
      <section className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        {sent ? (
          <div className="rounded-2xl border border-trust/30 bg-trust/10 p-6 text-sm">
            Thanks — your message has been noted. We’ll be in touch. (Foundation build: wire this form
            to your CRM/email provider before launch.)
          </div>
        ) : (
          <form
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
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
              <Label htmlFor="company">Company</Label>
              <Input id="company" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">How can we help?</Label>
              <Textarea id="message" rows={5} required />
            </div>
            <Button type="submit" variant="electric" size="lg">
              Send message
            </Button>
          </form>
        )}
      </section>
    </>
  );
}
