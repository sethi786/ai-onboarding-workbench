'use client';

import { useTransition } from 'react';
import { Plus } from 'lucide-react';
import { instantiateTemplate } from '@/lib/actions/templates';

export function InstantiateButton({
  orgId,
  orgSlug,
  templateId,
  disabled,
}: {
  orgId: string;
  orgSlug: string;
  templateId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={disabled || pending}
      onClick={() => startTransition(() => { instantiateTemplate(orgId, orgSlug, templateId); })}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-electric px-3 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      <Plus className="h-3.5 w-3.5" /> {pending ? 'Adding…' : 'Add to workspace'}
    </button>
  );
}
