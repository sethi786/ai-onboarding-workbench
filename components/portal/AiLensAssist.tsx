'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles, Check, HelpCircle, Paperclip } from 'lucide-react';
import { aiDraftLens } from '@/lib/actions/ai';
import type { DraftedLensAnswer } from '@/lib/ai/assist';
import type { TeamLens } from '@/workbench/types';
import { Button } from '@/components/ui/button';

/**
 * A first draft of one review team's section.
 *
 * The blank-page problem is the real cost of a governance process: somebody who
 * isn't a privacy specialist has to write a privacy assessment. This proposes
 * the narrative, points at which controls the intake data already supports, and
 * — the part reviewers value most — lists the specific questions to send the
 * vendor.
 *
 * Nothing is applied automatically. Each piece is inserted on click, and the
 * control suggestions are shown as claims to check rather than ticked for you:
 * a control marked satisfied by a model, unread by a human, is exactly the
 * failure this whole product exists to prevent.
 */
export function AiLensAssist({
  lens,
  evalId,
  canEdit,
  available,
  onInsertNotes,
  onInsertResidualRisk,
}: {
  lens: TeamLens;
  evalId: string;
  canEdit: boolean;
  available: boolean;
  onInsertNotes: (text: string) => void;
  onInsertResidualRisk: (text: string) => void;
}) {
  const [draft, setDraft] = useState<DraftedLensAnswer | null>(null);
  const [pending, startTransition] = useTransition();

  if (!available || !canEdit) return null;

  const controlLabel = (id: string) =>
    lens.requiredControls.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="rounded-md border border-electric/30 bg-electric/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-electric" />
        <span className="text-sm font-medium">Draft this section</span>
        <span className="text-xs text-muted-foreground">
          Proposes the narrative, the open controls, and what to ask the vendor.
        </span>
        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await aiDraftLens(evalId, lens.id);
              if (res.error) {
                toast.error(res.error);
                return;
              }
              setDraft(res.data ?? null);
            })
          }
        >
          {pending ? 'Drafting…' : draft ? 'Redraft' : 'Draft with AI'}
        </Button>
      </div>

      {draft && (
        <div className="mt-3 space-y-3">
          <Block
            title="Assessment narrative"
            action={{ label: 'Insert into notes', onClick: () => { onInsertNotes(draft.notes); toast.success('Added to notes'); } }}
          >
            <p className="text-sm">{draft.notes}</p>
          </Block>

          {draft.residualRisk && (
            <Block
              title="Residual risk"
              action={{
                label: 'Insert',
                onClick: () => { onInsertResidualRisk(draft.residualRisk); toast.success('Added to residual risk'); },
              }}
            >
              <p className="text-sm">{draft.residualRisk}</p>
            </Block>
          )}

          {draft.likelySatisfiedControlIds.length > 0 && (
            <Block title="Controls the intake data appears to satisfy">
              <ul className="space-y-1 text-sm">
                {draft.likelySatisfiedControlIds.map((id) => (
                  <li key={id} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric" />
                    <span>{controlLabel(id)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Suggestions only — tick a control yourself once you’ve confirmed it. You’re the one
                signing the assessment.
              </p>
            </Block>
          )}

          {draft.openControls.length > 0 && (
            <Block title="Controls that still need work">
              <ul className="space-y-1.5 text-sm">
                {draft.openControls.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{controlLabel(c.id)}</span>
                    <span className="text-muted-foreground"> — {c.why}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {draft.questionsToAsk.length > 0 && (
            <Block
              title="Questions to put to the vendor"
              action={{
                label: 'Copy',
                onClick: () => {
                  navigator.clipboard.writeText(draft.questionsToAsk.map((q) => `- ${q}`).join('\n'));
                  toast.success('Questions copied');
                },
              }}
            >
              <ul className="space-y-1 text-sm">
                {draft.questionsToAsk.map((q) => (
                  <li key={q} className="flex gap-2">
                    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {draft.evidenceToRequest.length > 0 && (
            <Block
              title="Evidence to request"
              action={{
                label: 'Copy',
                onClick: () => {
                  navigator.clipboard.writeText(draft.evidenceToRequest.map((e) => `- ${e}`).join('\n'));
                  toast.success('Evidence list copied');
                },
              }}
            >
              <ul className="space-y-1 text-sm">
                {draft.evidenceToRequest.map((e) => (
                  <li key={e} className="flex gap-2">
                    <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}

          <p className="text-xs text-muted-foreground">
            AI-drafted from this evaluation’s data. Read it before you rely on it — you own what
            goes into the review.
          </p>
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="ml-auto rounded border border-border px-2 py-0.5 text-xs font-medium hover:bg-muted"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
