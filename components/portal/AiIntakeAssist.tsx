'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles, CircleAlert } from 'lucide-react';
import { aiDraftIntake } from '@/lib/actions/ai';
import type { DraftedIntake } from '@/lib/ai/assist';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { AiUnavailable } from '@/components/portal/AiUnavailable';

/**
 * Intake is where adoptions stall: somebody has to translate "we want to use
 * this" into twenty governance fields, most of which they can't answer. Pasting
 * the vendor page or the request email and having the form propose the answers
 * turns a blocking form into something to review.
 *
 * The draft is never applied silently — the user sees the reasoning and what
 * couldn't be determined before anything lands in the form, because a wrong
 * guess that gets accepted quietly steers the whole review.
 */
export function AiIntakeAssist({
  orgId,
  available,
  onApply,
}: {
  orgId: string;
  available: boolean;
  onApply: (draft: DraftedIntake) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<DraftedIntake | null>(null);
  const [pending, startTransition] = useTransition();

  if (!available) {
    return (
      <AiUnavailable feature="Drafting an intake from a description">
        Paste a vendor page or request email and the form fills itself in, with its reasoning
        attached.
      </AiUnavailable>
    );
  }

  return (
    <div className="rounded-lg border border-electric/30 bg-electric/5 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Start from a description</h3>
          <p className="text-sm text-muted-foreground">
            Paste the vendor page, the request email, or a few lines about the tool. The form fills
            itself in and tells you what it couldn’t work out.
          </p>
        </div>
        {!open && (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Paste a description
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Northwind CRM is a cloud sales platform. We want it for the sales team to replace the legacy pipeline tracker. It stores customer contact records and integrates with our email and calendar…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await aiDraftIntake(orgId, text);
                  if (res.error) {
                    toast.error(res.error);
                    return;
                  }
                  setDraft(res.data ?? null);
                })
              }
            >
              {pending ? 'Reading…' : 'Draft the intake'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>

          {draft && (
            <div className="rounded-md border border-border bg-card p-4">
              <h4 className="text-sm font-semibold">Proposed intake</h4>
              <p className="mt-1 text-sm text-muted-foreground">{draft.reasoning}</p>

              <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <Row label="Name" value={draft.name} />
                <Row label="Vendor" value={draft.platform} />
                <Row label="Category" value={draft.toolCategory} />
                <Row label="Environment" value={draft.environment} />
                <Row label="Classification" value={draft.dataClassification} />
                <Row label="Data types" value={draft.dataTypes.join(', ')} />
                <Row
                  label="Characteristics"
                  value={
                    [
                      draft.agentEnabled && 'Agent',
                      draft.connectorEnabled && 'Integrations',
                      draft.ragEnabled && 'Retrieval',
                      draft.autonomousActions && 'Autonomous',
                      draft.externalVendor && 'Third-party',
                      draft.selfHosted && 'Self-hosted',
                      draft.pii && 'Personal data',
                      draft.clientData && 'Client data',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'none'
                  }
                />
              </dl>

              {draft.unanswered.length > 0 && (
                <div className="mt-3 flex gap-2 rounded-md bg-warning/10 p-2.5 text-xs text-[oklch(0.45_0.09_75)]">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Couldn’t determine from the text: {draft.unanswered.join(', ')}. Fill these in
                    yourself — they change which reviews apply.
                  </span>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    onApply(draft);
                    setOpen(false);
                    setDraft(null);
                    toast.success('Intake filled in — check it before saving');
                  }}
                >
                  Use this
                </Button>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 border-b border-border/60 py-1 last:border-0">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium">{value || '—'}</dd>
    </div>
  );
}
