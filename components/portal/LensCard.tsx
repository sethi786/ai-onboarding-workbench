'use client';

import { useState, useTransition, useRef } from 'react';
import { ChevronRight, Ban } from 'lucide-react';
import type { TeamLens, TeamAssessment, TeamScore, Decision, Profile } from '@/workbench/types';
import { controlsAtDepth, evidenceAtDepth, depthRationale } from '@/workbench/engine/reviewIntensity';
import { SCORE_LABELS, DECISION_OPTIONS } from '@/workbench/data/constants';
import {
  updateAssessment,
  addEvidenceLink,
  removeEvidenceLink,
} from '@/lib/actions/assessments';
import { AiLensAssist } from '@/components/portal/AiLensAssist';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { LensIcon } from '@/components/icons/LensIcon';
import { cn } from '@/lib/utils';
import { readinessTone, decisionTone } from './status';

interface Props {
  lens: TeamLens;
  assessment: TeamAssessment;
  teamScore: TeamScore;
  evalId: string;
  orgId: string;
  orgSlug: string;
  canEdit: boolean;
  defaultOpen?: boolean;
  aiAvailable?: boolean;
  /** Needed to work out how deep this team's review goes for this tool. */
  profile: Profile;
}

export function LensCard({ lens, assessment, teamScore, evalId, orgId, orgSlug, canEdit, defaultOpen, aiAvailable, profile }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [a, setA] = useState(assessment);
  const [, startTransition] = useTransition();
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Depth decides what this team asks for. Rendering the full control set and
  // scoring against a subset would tell the reviewer two different stories.
  const depth = teamScore.depth;
  const controls = controlsAtDepth(lens, depth);
  const evidence = evidenceAtDepth(lens, depth);
  const deferredControls = lens.requiredControls.length - controls.length;
  const deferredEvidence = lens.evidenceRequired.length - evidence.length;
  const controlsDone = controls.filter((c) => a.checkedControls[c.id]).length;
  const evidenceDone = evidence.filter((e) => a.checkedEvidence[e.id]).length;

  // Persist the FULL map on each toggle (not a server-side read-modify-write),
  // so rapid successive toggles can't clobber each other's keys.
  const doToggle = (
    localField: 'checkedControls' | 'checkedEvidence' | 'activeBlockers',
    key: string,
  ) => {
    if (!canEdit) return;
    const nextMap = { ...a[localField], [key]: !a[localField][key] };
    setA((prev) => ({ ...prev, [localField]: nextMap }));
    startTransition(() => {
      updateAssessment(evalId, orgId, orgSlug, lens.id, { [localField]: nextMap });
    });
  };

  const patch = (p: Partial<TeamAssessment>, persist = true) => {
    setA((prev) => ({ ...prev, ...p }));
    if (persist && canEdit) startTransition(() => { updateAssessment(evalId, orgId, orgSlug, lens.id, p); });
  };

  const patchNotesDebounced = (p: Partial<TeamAssessment>) => {
    setA((prev) => ({ ...prev, ...p }));
    if (!canEdit) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      startTransition(() => { updateAssessment(evalId, orgId, orgSlug, lens.id, p); });
    }, 700);
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-2 p-4 text-left sm:gap-3"
      >
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} />
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-electric/10 text-electric">
          <LensIcon id={lens.id} className="h-3.5 w-3.5" />
        </span>
        <span className="font-semibold">{lens.title}</span>
        {!teamScore.required && <Badge tone="neutral">Not required</Badge>}
        <Badge tone={depth === 'Deep' ? 'warning' : depth === 'Standard' ? 'trust' : 'neutral'}>
          {depth}
        </Badge>
        {teamScore.escalated && <Badge tone="electric">Escalated</Badge>}
        <div className="flex items-center gap-2 max-sm:mt-1 max-sm:w-full max-sm:justify-between sm:ml-auto sm:gap-3">
          <span className="text-xs text-muted-foreground">
            {a.score < 0 ? 'Not scored' : `${a.score}/5`}
          </span>
          <div className="w-24"><Progress value={teamScore.normalized} showLabel /></div>
          {teamScore.hasCriticalBlocker && <Badge tone="danger">Blocker</Badge>}
          <Badge tone={decisionTone(a.decision)}>{a.decision}</Badge>
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-border p-4">
          {teamScore.hasCriticalBlocker && (
            <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              <Ban className="h-4 w-4 shrink-0" /> Blocked until remediated.
            </div>
          )}

          {/* Reviewers push back on scope constantly; saying why up front is
              cheaper than the argument. */}
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">{depthRationale(lens, profile)}</p>
            {(deferredControls > 0 || deferredEvidence > 0) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  deferredControls > 0 && `${deferredControls} further control${deferredControls === 1 ? '' : 's'}`,
                  deferredEvidence > 0 && `${deferredEvidence} further document${deferredEvidence === 1 ? '' : 's'}`,
                ]
                  .filter(Boolean)
                  .join(' and ')}{' '}
                would be asked at a deeper review. Not skipped — not warranted yet.
              </p>
            )}
          </div>

          <div>
            <SectionLabel>Review purpose</SectionLabel>
            <p className="text-sm text-muted-foreground">{lens.reviewPurpose}</p>
          </div>

          <div>
            <SectionLabel>Scope</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {lens.scope.map((s) => (
                <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>

          <Collapsible title={`Detailed review checklist (${lens.checklist.length})`}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {lens.checklist.map((c) => <li key={c.id}>{c.text}</li>)}
            </ul>
          </Collapsible>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel>Required controls</SectionLabel>
                <span className="text-xs text-muted-foreground">{controlsDone}/{controls.length}</span>
              </div>
              {controls.map((c) => (
                <CheckRow key={c.id} checked={!!a.checkedControls[c.id]} onChange={() => doToggle('checkedControls', c.id)} disabled={!canEdit}>
                  {c.label}{c.critical && <CriticalTag />}
                </CheckRow>
              ))}
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel>Evidence required</SectionLabel>
                <span className="text-xs text-muted-foreground">{evidenceDone}/{evidence.length}</span>
              </div>
              {evidence.length === 0 ? (
                <p className="py-1 text-xs text-muted-foreground">
                  A screening review collects no documents. Deepen the review by raising the
                  environment or data classification.
                </p>
              ) : evidence.map((e) => (
                <CheckRow key={e.id} checked={!!a.checkedEvidence[e.id]} onChange={() => doToggle('checkedEvidence', e.id)} disabled={!canEdit}>
                  {e.label}
                </CheckRow>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border p-3">
            <SectionLabel>Blockers / No-Go criteria</SectionLabel>
            <div className="mt-1">
              {lens.blockers.map((b) => (
                <CheckRow key={b.id} checked={!!a.activeBlockers[b.id]} onChange={() => doToggle('activeBlockers', b.id)} disabled={!canEdit}>
                  {b.label}{b.critical && <CriticalTag />}
                </CheckRow>
              ))}
            </div>
          </div>

          {/* Self-assessment */}
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Self-assessment</SectionLabel>
              <Badge tone={readinessTone(teamScore.normalized)}>{teamScore.normalized}% ready</Badge>
            </div>

            <Label>Readiness score</Label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    disabled={!canEdit}
                    onClick={() => patch({ score: n })}
                    title={SCORE_LABELS[n]}
                    className={cn(
                      'border-r border-border px-3 py-1 text-sm font-semibold last:border-r-0',
                      a.score === n ? 'bg-navy text-white' : 'bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{a.score < 0 ? 'Not scored' : SCORE_LABELS[a.score]}</span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input value={a.owner} disabled={!canEdit} onChange={(e) => patchNotesDebounced({ owner: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={a.dueDate} disabled={!canEdit} onChange={(e) => patch({ dueDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Decision</Label>
                <Select value={a.decision} disabled={!canEdit} onChange={(e) => patch({ decision: e.target.value as Decision })}>
                  {DECISION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                </Select>
              </div>
            </div>

            <div className="mt-3">
              <AiLensAssist
                lens={lens}
                evalId={evalId}
                canEdit={canEdit}
                available={Boolean(aiAvailable)}
                // Append rather than replace: a reviewer who has already written
                // something should never lose it to a draft.
                onInsertNotes={(text) =>
                  patchNotesDebounced({ notes: a.notes ? `${a.notes}\n\n${text}` : text })
                }
                onInsertResidualRisk={(text) =>
                  patchNotesDebounced({
                    residualRisk: a.residualRisk ? `${a.residualRisk}\n\n${text}` : text,
                  })
                }
              />
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={a.notes} disabled={!canEdit} placeholder="What you learned, gaps, how you'd explain this in review…" onChange={(e) => patchNotesDebounced({ notes: e.target.value })} />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Residual risk to accept</Label>
              <Textarea value={a.residualRisk} disabled={!canEdit} onChange={(e) => patchNotesDebounced({ residualRisk: e.target.value })} />
            </div>

            <EvidenceLinks
              links={a.evidenceLinks}
              canEdit={canEdit}
              onAdd={(label, url) => {
                startTransition(() => { addEvidenceLink(evalId, orgId, orgSlug, lens.id, label, url); });
              }}
              onRemove={(id) => {
                setA((prev) => ({ ...prev, evidenceLinks: prev.evidenceLinks.filter((l) => l.id !== id) }));
                startTransition(() => { removeEvidenceLink(id, evalId, orgSlug); });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}
function CriticalTag() {
  return <span className="ml-1.5 rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">critical</span>;
}
function CheckRow({ checked, onChange, disabled, children }: { checked: boolean; onChange: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 py-1 text-sm">
      <input type="checkbox" className="mt-1" checked={checked} onChange={onChange} disabled={disabled} />
      <span>{children}</span>
    </label>
  );
}
function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left text-sm font-medium">
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
        {title}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}
function EvidenceLinks({ links, canEdit, onAdd, onRemove }: {
  links: { id: string; label: string; url: string }[];
  canEdit: boolean;
  onAdd: (label: string, url: string) => void;
  onRemove: (id: string) => void;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  return (
    <div className="mt-3">
      <Label>Evidence links</Label>
      <div className="mt-1 space-y-1.5">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-2 text-sm">
            <a href={l.url} target="_blank" rel="noreferrer" className="text-electric hover:underline">{l.label || l.url}</a>
            {canEdit && <button onClick={() => onRemove(l.id)} className="text-xs text-muted-foreground hover:text-danger">✕</button>}
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="mt-2 flex gap-2">
          <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="max-w-[160px]" />
          <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            onClick={() => { if (url) { onAdd(label, url); setLabel(''); setUrl(''); } }}
            className="shrink-0 rounded-md border border-border px-3 text-sm hover:bg-muted"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
