'use client';

import { useState, useEffect } from 'react';
import { useGovernanceSave } from './useGovernanceSave';
import { isSafeEvidenceUrl } from '@/workbench/engine/evidence';
import { ChevronRight, Ban } from 'lucide-react';
import type { TeamLens, TeamAssessment, TeamScore, Decision } from '@/workbench/types';
import { SCORE_LABELS, DECISION_OPTIONS } from '@/workbench/data/constants';
import {
  updateAssessment,
  confirmAssessmentScope,
  addEvidenceLink,
  removeEvidenceLink,
} from '@/lib/actions/assessments';
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
  scopeRevision: number;
}

export function LensCard({ lens, assessment, teamScore, evalId, orgId, orgSlug, canEdit, defaultOpen, scopeRevision }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [a, setA] = useState(assessment);
  const { save, pending, error } = useGovernanceSave();
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setA((prev) => dirty ? { ...prev, evidenceLinks: assessment.evidenceLinks } : assessment);
  }, [assessment, dirty]);
  const disabled = !canEdit || pending;
  const controlsDone = lens.requiredControls.filter((c) => a.checkedControls[c.id]).length;
  const evidenceDone = teamScore.evidenceComplete;
  const patch = (p: Partial<TeamAssessment>) => {
    if (disabled) return;
    setA((prev) => ({ ...prev, ...p }));
    setDirty(true);
  };
  const doToggle = (field: 'checkedControls' | 'checkedEvidence' | 'activeBlockers', key: string) => {
    if (disabled) return;
    setA((prev) => ({ ...prev, [field]: { ...prev[field], [key]: !prev[field][key] } }));
    setDirty(true);
  };
  const saveAssessment = () => {
    const { score, checkedControls, checkedEvidence, activeBlockers, markedLearned, needsRemediation, requiresFormalApproval, notes, owner, dueDate, residualRisk, decision } = a;
    save(() => updateAssessment(evalId, orgId, orgSlug, lens.id, { score, checkedControls, checkedEvidence, activeBlockers, markedLearned, needsRemediation, requiresFormalApproval, notes, owner, dueDate, residualRisk, decision }), () => setDirty(false));
  };

  return (
    <div id={lens.id} className="scroll-mt-6 rounded-lg border border-border bg-card">
      <button
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-2 p-4 text-left sm:gap-3"
      >
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} />
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-electric/10 text-electric">
          <LensIcon id={lens.id} className="h-3.5 w-3.5" />
        </span>
        <span className="font-semibold">{lens.title}</span>
        {!teamScore.required && <Badge tone="neutral">Not required</Badge>}
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
          {error && <p role="alert" className="text-sm text-danger">Not saved: {error}</p>}
          {!teamScore.scopeCurrent && <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
            <p>Review these answers for scope revision {scopeRevision}. Earlier answers are preserved but do not count yet. Evidence must be attached for the current scope.</p>
            <button disabled={disabled || dirty} className="mt-2 rounded border px-3 py-1 disabled:opacity-50" onClick={() => save(() => confirmAssessmentScope(evalId, orgSlug, lens.id, scopeRevision))}>I reviewed these answers for the current scope</button>
            {dirty && <p>Save your edits before confirming the scope.</p>}
          </div>}
          {canEdit && <div className="flex items-center gap-3">
            <button disabled={disabled || !dirty} onClick={saveAssessment} className="rounded-md bg-electric px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save assessment'}</button>
            <span role="status" className="text-xs text-muted-foreground">{dirty ? 'Unsaved changes — scores update after saving.' : 'Showing saved assessment'}</span>
          </div>}
          {teamScore.hasCriticalBlocker && (
            <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              <Ban className="h-4 w-4 shrink-0" /> Blocked until remediated.
            </div>
          )}

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
                <span className="text-xs text-muted-foreground">{controlsDone}/{lens.requiredControls.length}</span>
              </div>
              {lens.requiredControls.map((c) => (
                <CheckRow key={c.id} checked={!!a.checkedControls[c.id]} onChange={() => doToggle('checkedControls', c.id)} disabled={disabled}>
                  {c.label}{c.critical && <CriticalTag />}
                </CheckRow>
              ))}
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel>Evidence supported</SectionLabel>
                <span className="text-xs text-muted-foreground">{evidenceDone}/{lens.evidenceRequired.length}</span>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">Check each reviewed item and attach a matching current link below. Links are not independently verified.</p>
              {lens.evidenceRequired.map((e) => (
                <CheckRow key={e.id} checked={!!a.checkedEvidence[e.id]} onChange={() => doToggle('checkedEvidence', e.id)} disabled={disabled}>
                  {e.label}
                </CheckRow>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border p-3">
            <SectionLabel>Blockers / No-Go criteria</SectionLabel>
            <div className="mt-1">
              {lens.blockers.map((b) => (
                <CheckRow key={b.id} checked={!!a.activeBlockers[b.id]} onChange={() => doToggle('activeBlockers', b.id)} disabled={disabled}>
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
                    disabled={disabled}
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
                <Input value={a.owner} disabled={disabled} onChange={(e) => patch({ owner: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={a.dueDate} disabled={disabled} onChange={(e) => patch({ dueDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Decision</Label>
                <Select value={a.decision} disabled={disabled} onChange={(e) => patch({ decision: e.target.value as Decision })}>
                  {DECISION_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                </Select>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={a.notes} disabled={disabled} placeholder="What you learned, gaps, how you'd explain this in review…" onChange={(e) => patch({ notes: e.target.value })} />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Residual risk to accept</Label>
              <Textarea value={a.residualRisk} disabled={disabled} onChange={(e) => patch({ residualRisk: e.target.value })} />
            </div>
            <CheckRow checked={a.needsRemediation} onChange={() => patch({ needsRemediation: !a.needsRemediation })} disabled={disabled}>
              Remediation work remains open
            </CheckRow>

            <EvidenceLinks
              links={a.evidenceLinks}
              requirements={lens.evidenceRequired}
              scopeRevision={scopeRevision}
              canEdit={canEdit && !pending && !dirty}
              onAdd={(label, url, evidenceId, expiresOn, done) => save(() => addEvidenceLink(evalId, orgId, orgSlug, lens.id, label, url, evidenceId, expiresOn, scopeRevision), done)}
              onRemove={(id) => save(() => removeEvidenceLink(id, evalId, orgSlug))}
            />
            {dirty && <p className="mt-2 text-xs text-muted-foreground">Save the assessment before adding or removing evidence.</p>}
            {canEdit && <button disabled={disabled || !dirty} onClick={saveAssessment} className="mt-4 rounded-md bg-electric px-3 py-2 text-sm text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save assessment'}</button>}
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
function EvidenceLinks({ links, requirements, scopeRevision, canEdit, onAdd, onRemove }: {
  links: TeamAssessment['evidenceLinks'];
  requirements: TeamLens['evidenceRequired'];
  scopeRevision: number;
  canEdit: boolean;
  onAdd: (label: string, url: string, evidenceId: string, expiresOn: string, done: () => void) => void;
  onRemove: (id: string) => void;
}) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [evidenceId, setEvidenceId] = useState(requirements[0]?.id ?? '');
  const [expiresOn, setExpiresOn] = useState('');
  return (
    <div className="mt-3">
      <Label>Evidence references</Label>
      <div className="mt-1 space-y-2">
        {links.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-2 text-sm">
            {isSafeEvidenceUrl(l.url) ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="break-all text-electric hover:underline">{l.label || l.url}</a> : <span>{l.label || 'Unsupported URL'}</span>}
            <span className="text-xs text-muted-foreground">{requirements.find((e) => e.id === l.evidenceId)?.label ?? 'Unassigned legacy reference'} · {l.scopeRevision === scopeRevision ? 'Current scope' : 'Earlier scope'}{l.expiresOn ? ` · Expires ${l.expiresOn}` : ''}</span>
            {canEdit && <button aria-label={`Remove ${l.label || 'evidence reference'}`} onClick={() => onRemove(l.id)} className="text-xs text-danger">Remove</button>}
          </div>
        ))}
      </div>
      {canEdit && <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs">Evidence requirement<Select value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)}>{requirements.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</Select></label>
        <label className="text-xs">Reference label<Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={200} /></label>
        <label className="text-xs">Document URL<Input type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <label className="text-xs">Expiry date (optional)<Input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} /></label>
        <button disabled={!label.trim() || !isSafeEvidenceUrl(url) || !evidenceId} onClick={() => onAdd(label, url, evidenceId, expiresOn, () => { setLabel(''); setUrl(''); setExpiresOn(''); })} className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50">Attach reference</button>
      </div>}
    </div>
  );
}
