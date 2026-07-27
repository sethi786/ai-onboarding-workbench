import { Link } from 'react-router-dom';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useScoring } from '../hooks/useScoring';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  riskTone,
  approvalTone,
  recommendationTone,
  readinessTone,
} from '../components/ui/statusColors';
import { DISCLAIMER } from '../data/constants';
import { LENS_BY_ID } from '../data/teamLenses';
import type { TeamId } from '../types';

function titleFor(teamId: string): string {
  return LENS_BY_ID[teamId as TeamId]?.title ?? teamId;
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`stat ${accent ? 'stat--accent' : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const profile = useActiveProfile();
  const score = useScoring(profile);

  if (!profile || !score) {
    return (
      <EmptyState title="No profile selected" hint="Create a profile to see the dashboard.">
        <Link to="/profiles" className="btn btn--primary">
          Go to Profiles
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Executive Dashboard</h1>
        <p className="page-head__sub">
          Readiness snapshot for the selected profile across all required review lenses.
        </p>
      </div>

      <div className="disclaimer">{DISCLAIMER}</div>

      {score.hasCriticalBlocker && (
        <div className="blocker-banner">
          ⛔ Blocked until remediated — a critical blocker is active in one or more review areas.
        </div>
      )}

      <div className="grid grid--dash">
        <Stat label="Selected Profile" value={<span style={{ fontSize: 17 }}>{profile.name}</span>} hint={`${profile.platform} · ${profile.environment}`} accent />
        <Stat
          label="Overall Readiness"
          value={
            <span style={{ color: `var(--c-${readinessTone(score.readiness)})` }}>
              {score.readiness}
              <span style={{ fontSize: 14 }}>/100</span>
            </span>
          }
          hint={<ProgressBar value={score.readiness} />}
        />
        <div className="stat">
          <span className="stat__label">Overall Risk</span>
          <span style={{ marginTop: 4 }}>
            <Badge tone={riskTone(score.risk)}>{score.risk}</Badge>
          </span>
          <span className="stat__hint">Based on data sensitivity & capabilities</span>
        </div>
        <div className="stat">
          <span className="stat__label">Approval Status</span>
          <span style={{ marginTop: 4 }}>
            <Badge tone={approvalTone(score.approvalStatus)}>{score.approvalStatus}</Badge>
          </span>
          <span className="stat__hint">Derived from readiness & blockers</span>
        </div>
        <div className="stat">
          <span className="stat__label">Recommendation</span>
          <span style={{ marginTop: 4 }}>
            <Badge tone={recommendationTone(score.recommendation)}>{score.recommendation}</Badge>
          </span>
          <span className="stat__hint">Self-evaluation go/no-go signal</span>
        </div>
        <Stat label="Evidence Complete" value={`${score.evidenceCompleteness}%`} hint="Required evidence attached" />
        <Stat label="Blockers" value={score.blockersCount} hint="Active across all teams" />
        <Stat label="Teams Ready" value={score.teamsReady} hint={`of ${score.requiredTeams} required`} />
        <Stat label="Teams Blocked" value={score.teamsBlocked} hint="Critical blocker active" />
        <Stat label="Controls Complete" value={score.controlsComplete} />
        <Stat label="Controls Remaining" value={score.controlsRemaining} />
      </div>

      <div className="card">
        <div className="card__head">
          <span className="card__title">Required Team Readiness</span>
          <Link to="/self-evaluation" className="btn btn--sm" style={{ marginLeft: 'auto' }}>
            Open Self-Evaluation →
          </Link>
        </div>
        <div className="card__body stack" style={{ gap: 10 }}>
          {Object.values(score.perTeam)
            .filter((t) => t.required)
            .map((t) => {
              return (
                <div className="row" key={t.teamId} style={{ gap: 12 }}>
                  <span style={{ width: 210, fontSize: 13 }}>{titleFor(t.teamId)}</span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={t.normalized} showLabel />
                  </div>
                  {t.hasCriticalBlocker && <Badge tone="red">Blocker</Badge>}
                  {t.escalated && <Badge tone="purple">Escalated</Badge>}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
