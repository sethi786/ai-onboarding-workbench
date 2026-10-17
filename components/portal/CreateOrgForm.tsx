'use client';

import { useState, useTransition } from 'react';
import { createOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { unstable_rethrow } from 'next/navigation';

export function CreateOrgForm({ template = '' }: { template?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          try {
            const res = await createOrganization(fd);
            if (res?.error) setError(res.error);
          } catch (error) {
            unstable_rethrow(error);
            setError(
              'We couldn’t create your workspace. Your details are still here; please retry.',
            );
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="template" value={template} />
      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Organization name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Financial"
          maxLength={120}
          required
        />
      </div>
      <Button
        type="submit"
        variant="electric"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending ? 'Creating…' : 'Create workspace'}
      </Button>
    </form>
  );
}
