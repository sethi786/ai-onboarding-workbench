'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteEvaluation } from '@/lib/actions/evaluations';
import { Button } from '@/components/ui/button';

/**
 * Destructive delete with an explicit confirm step. Deleting frees an
 * evaluation slot, which matters on plans with a cap.
 */
export function DeleteEvaluationButton({
  evalId,
  orgSlug,
  evalName,
}: {
  evalId: string;
  orgSlug: string;
  evalName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteEvaluation(evalId, orgSlug);
      // A successful delete redirects, so reaching here means it failed.
      if (res?.error) {
        toast.error(res.error);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4" /> Delete evaluation
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">
        Permanently delete <strong className="text-foreground">{evalName}</strong> and all its
        assessments?
      </span>
      <Button variant="danger" disabled={pending} onClick={onDelete}>
        {pending ? 'Deleting…' : 'Yes, delete'}
      </Button>
      <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
