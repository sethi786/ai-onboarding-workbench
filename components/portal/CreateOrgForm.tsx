'use client';

import { useState, useTransition } from 'react';
import { createOrganization } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export function CreateOrgForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError(null);
          const res = await createOrganization(fd);
          if (res?.error) setError(res.error);
        })
      }
      className="space-y-4"
    >
      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" name="name" placeholder="Acme Financial" required />
      </div>
      <Button type="submit" variant="electric" size="lg" disabled={pending} className="w-full">
        {pending ? 'Creating…' : 'Create workspace'}
      </Button>
    </form>
  );
}
