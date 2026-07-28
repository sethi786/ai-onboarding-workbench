'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { History, Check } from 'lucide-react';
import type { Recollection, RecallSummary } from '@/workbench/engine/memory';
import type { TeamLens } from '@/workbench/types';
import { Button } from '@/components/ui/button';

/**
 * What this workspace already answered, offered against the lens in front of you.
 *
 * Shown as a claim to verify, never as a completed answer — the source review
 * and the reason it matched are both on screen before anything is applied,
 * because a control ticked on the strength of a different tool is the exact
 * failure a governance product cannot afford.
 */
export function RecallPanel({
  lens,
  summary,
  recollections,
  canEdit,
  onApply,
}: {
  lens: TeamLens;
  summary: RecallSummary;
  recollections: Recollection[];
  canEdit: boolean;
  onApply: (recollections: Recollection[]) => Promise<{ applied: number } | void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (recollections.length === 0 || !canEdit) return null;

  const label = (id: string) =>
    lens.requiredControls.find((c) => c.id === id)?.label ??
    lens.evidenceRequired.find((e) => e.id === id)?.label ??
    id;

  const total = summary.controlCount + summary.evidenceCount;
  const sourceNames = summary.sources.map((s) => s.toolName);

  return (
    <div className="rounded-md border border-trust/40 bg-trust/8 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <History className="h-3.5 w-3.5 shrink-0 text-trust" />
        <span className="text-sm font-medium">
          You answered {total} of these before
        </span>
        <span className="text-xs text-muted-foreground">
          from {sourceNames.slice(0, 2).join(', ')}
          {sourceNames.length > 2 ? ` and ${sourceNames.length - 2} more` : ''}
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            {expanded ? 'Hide' : 'Review'}
          </button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || applied}
            onClick={() =>
              startTransition(async () => {
                const res = await onApply(recollections);
                const n = res?.applied ?? 0;
                setApplied(true);
                toast.success(
                  n === 0
                    ? 'Everything recalled was already answered'
                    : `Filled in ${n} ${n === 1 ? 'answer' : 'answers'} — check them before you sign off`,
                );
              })
            }
          >
            {applied ? 'Applied' : pending ? 'Filling…' : 'Use these'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {recollections.map((r) => (
            <div key={r.itemId} className="rounded border border-border bg-card p-2.5">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trust" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{label(r.itemId)}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Answered for <strong className="text-foreground">{r.source.toolName}</strong> on{' '}
                    {new Date(r.source.reviewedAt).toLocaleDateString()} · {r.similarity.reasons.join(', ')}
                  </div>
                  {r.note && (
                    <p className="mt-1.5 border-l-2 border-border pl-2 text-xs italic text-muted-foreground">
                      {r.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            These are prior answers from comparable tools, not verified facts about this one. Confirm
            each before you sign off — your name goes on the assessment.
          </p>
        </div>
      )}
    </div>
  );
}
