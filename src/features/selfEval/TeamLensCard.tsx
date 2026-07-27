import { useState } from 'react';
import type { TeamLens, TeamScore, Decision } from '../../types';
import { useWorkbenchStore, genId } from '../../store/useWorkbenchStore';
import { Badge } from '../../components/ui/Badge';
import { Accordion } from '../../components/ui/Accordion';
import { ScoreSelect } from '../../components/ui/ScoreSelect';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Field } from '../../components/ui/Field';
import { readinessTone, decisionTone } from '../../components/ui/statusColors';
import { DECISION_OPTIONS } from '../../data/constants';

interface Props {
  profileId: string;
  lens: TeamLens;
  teamScore: TeamScore;
  defaultOpen?: boolean;
}

export function TeamLensCard({ profileId, lens, teamScore, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const assessment = useWorkbenchStore((s) => s.getAssessment(profileId, lens.id));
  const update = useWorkbenchStore((s) => s.updateAssessment);
  const toggleControl = useWorkbenchStore((s) => s.toggleControl);
  const toggleEvidence = useWorkbenchStore((s) => s.toggleEvidence);
  const toggleBlocker = useWorkbenchStore((s) => s.toggleBlocker);

  const patch = (p: Partial<typeof assessment>) => update(profileId, lens.id, p);

  const addLink = () =>
    patch({
      evidenceLinks: [
        ...assessment.evidenceLinks,
        { id: genId('lnk'), label: '', url: '' },
      ],
    });
  const updateLink = (id: string, key: 'label' | 'url', value: string) =>
    patch({
      evidenceLinks: assessment.evidenceLinks.map((l) =>
        l.id === id ? { ...l, [key]: value } : l,
      ),
    });
  const removeLink = (id: string) =>
    patch({ evidenceLinks: assessment.evidenceLinks.filter((l) => l.id !== id) });

  return (
    <div className={`card team-card ${open ? 'team-card--open' : ''}`}>
      <div className="team-card__head" onClick={() => setOpen((o) => !o)}>
        <span className={`acc__chevron ${open ? 'acc__chevron--open' : ''}`}>▶</span>
        <span style={{ fontSize: 18 }}>{lens.icon}</span>
        <span className="team-card__title">{lens.title}</span>
        {!teamScore.required && <Badge tone="gray">Not required</Badge>}
        {teamScore.escalated && <Badge tone="purple">Escalated</Badge>}
        <div className="team-card__meta">
          <span className="subtle" style={{ fontSize: 12 }}>
            Score {assessment.score < 0 ? '—' : `${assessment.score}/5`}
          </span>
          <div style={{ width: 90 }}>
            <ProgressBar value={teamScore.normalized} showLabel />
          </div>
          {teamScore.hasCriticalBlocker && <Badge tone="red">Blocker</Badge>}
          <Badge tone={decisionTone(assessment.decision)}>{assessment.decision}</Badge>
        </div>
      </div>

      {open && (
        <div className="team-card__body stack">
          {teamScore.hasCriticalBlocker && (
            <div className="blocker-banner">⛔ Blocked until remediated.</div>
          )}

          <div>
            <div className="section-title">Review purpose</div>
            <p className="muted">{lens.reviewPurpose}</p>
          </div>

          <div>
            <div className="section-title">Scope of review</div>
            <div className="chip-list">
              {lens.scope.map((s) => (
                <span className="tag" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid--2">
            <Accordion title="Detailed review checklist" count={lens.checklist.length}>
              <ul>
                {lens.checklist.map((c) => (
                  <li key={c.id}>{c.text}</li>
                ))}
              </ul>
            </Accordion>

            <Accordion title="Review questions & common findings">
              <div className="section-title" style={{ marginTop: 0 }}>
                Common findings
              </div>
              <ul>
                {lens.commonFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <div className="section-title">Remediation actions</div>
              <ul>
                {lens.remediation.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Accordion>
          </div>

          <div className="grid grid--2">
            <div className="card">
              <div className="card__head">
                <span className="card__title">Required controls</span>
                <span className="acc__count">
                  {teamScore.controlsComplete}/{teamScore.controlsTotal} complete
                </span>
              </div>
              <div className="card__body">
                {lens.requiredControls.map((c) => (
                  <label className="checkbox" key={c.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(assessment.checkedControls[c.id])}
                      onChange={() => toggleControl(profileId, lens.id, c.id)}
                    />
                    <span>
                      {c.label}
                      {c.critical && (
                        <span className="tag badge--red" style={{ marginLeft: 6 }}>
                          critical
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <span className="card__title">Evidence required</span>
                <span className="acc__count">
                  {teamScore.evidenceComplete}/{teamScore.evidenceTotal} attached
                </span>
              </div>
              <div className="card__body">
                {lens.evidenceRequired.map((e) => (
                  <label className="checkbox" key={e.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(assessment.checkedEvidence[e.id])}
                      onChange={() => toggleEvidence(profileId, lens.id, e.id)}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid--2">
            <Accordion title="Pass criteria" defaultOpen count={lens.passCriteria.length}>
              <ul>
                {lens.passCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Conditional approval" count={lens.conditionalApproval.length}>
              <ul>
                {lens.conditionalApproval.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Accordion>
          </div>

          <div className="card">
            <div className="card__head">
              <span className="card__title">Blockers / No-Go criteria</span>
              <span className="acc__count">Check any that currently apply</span>
            </div>
            <div className="card__body">
              {lens.blockers.map((b) => (
                <label className="checkbox" key={b.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(assessment.activeBlockers[b.id])}
                    onChange={() => toggleBlocker(profileId, lens.id, b.id)}
                  />
                  <span>
                    {b.label}
                    {b.critical && (
                      <span className="tag badge--red" style={{ marginLeft: 6 }}>
                        critical
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Self-assessment */}
          <div className="card">
            <div className="card__head">
              <span className="card__title">Self-assessment</span>
              <Badge tone={readinessTone(teamScore.normalized)}>
                {teamScore.normalized}% ready
              </Badge>
            </div>
            <div className="card__body stack">
              <Field label="Readiness score (0–5)">
                <ScoreSelect value={assessment.score} onChange={(v) => patch({ score: v })} />
              </Field>

              <div className="form-grid">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={assessment.markedLearned}
                    onChange={(e) => patch({ markedLearned: e.target.checked })}
                  />
                  Mark as learned
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={assessment.needsRemediation}
                    onChange={(e) => patch({ needsRemediation: e.target.checked })}
                  />
                  Needs remediation
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={assessment.requiresFormalApproval}
                    onChange={(e) => patch({ requiresFormalApproval: e.target.checked })}
                  />
                  Requires formal approval
                </label>
              </div>

              <div className="form-grid">
                <Field label="Owner">
                  <input
                    value={assessment.owner}
                    onChange={(e) => patch({ owner: e.target.value })}
                  />
                </Field>
                <Field label="Due date">
                  <input
                    type="date"
                    value={assessment.dueDate}
                    onChange={(e) => patch({ dueDate: e.target.value })}
                  />
                </Field>
                <Field label="Approval decision">
                  <select
                    value={assessment.decision}
                    onChange={(e) => patch({ decision: e.target.value as Decision })}
                  >
                    {DECISION_OPTIONS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  value={assessment.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder="What you learned, gaps, how you would explain this in review…"
                />
              </Field>
              <Field label="Residual risk to accept">
                <textarea
                  value={assessment.residualRisk}
                  onChange={(e) => patch({ residualRisk: e.target.value })}
                />
              </Field>

              <div>
                <div className="row spread" style={{ marginBottom: 6 }}>
                  <span className="field__label">Evidence links</span>
                  <button type="button" className="btn btn--sm" onClick={addLink}>
                    + Add link
                  </button>
                </div>
                {assessment.evidenceLinks.length === 0 && (
                  <p className="subtle" style={{ fontSize: 12 }}>
                    No evidence links yet.
                  </p>
                )}
                {assessment.evidenceLinks.map((l) => (
                  <div className="row" key={l.id} style={{ marginBottom: 6 }}>
                    <input
                      placeholder="Label"
                      value={l.label}
                      style={{ maxWidth: 180 }}
                      onChange={(e) => updateLink(l.id, 'label', e.target.value)}
                    />
                    <input
                      placeholder="https://…"
                      value={l.url}
                      onChange={(e) => updateLink(l.id, 'url', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn--sm btn--danger"
                      onClick={() => removeLink(l.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
