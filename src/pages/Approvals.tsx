import { useActiveProfile } from '../hooks/useActiveProfile';
import { useScoring } from '../hooks/useScoring';
import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { TEAM_LENSES } from '../data/teamLenses';
import { EmptyState } from '../components/ui/EmptyState';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { decisionTone, readinessTone } from '../components/ui/statusColors';
import { DECISION_OPTIONS } from '../data/constants';
import type { Decision, TeamId } from '../types';

interface Row extends Record<string, unknown> {
  teamId: TeamId;
  team: string;
  required: boolean;
  readiness: number;
  decision: Decision;
  owner: string;
  due: string;
}

export default function Approvals() {
  const profile = useActiveProfile();
  const score = useScoring(profile);
  const update = useWorkbenchStore((s) => s.updateAssessment);
  const getAssessment = useWorkbenchStore((s) => s.getAssessment);

  if (!profile || !score) {
    return <EmptyState title="No profile selected" hint="Create a profile to track approvals." />;
  }

  const rows: Row[] = TEAM_LENSES.map((lens) => {
    const a = getAssessment(profile.id, lens.id);
    const ts = score.perTeam[lens.id];
    return {
      teamId: lens.id,
      team: lens.title,
      required: ts.required,
      readiness: ts.normalized,
      decision: a.decision,
      owner: a.owner,
      due: a.dueDate,
    };
  });

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Approvals</h1>
        <p className="page-head__sub">
          Sign-off matrix across all review lenses. Set the self-evaluation decision per team.
        </p>
      </div>

      <div className="row wrap" style={{ gap: 16 }}>
        <Badge tone={readinessTone(score.readiness)}>Overall readiness {score.readiness}/100</Badge>
        <Badge tone="blue">{score.approvalStatus}</Badge>
        <Badge tone="gray">
          {score.teamsReady}/{score.requiredTeams} required teams ready
        </Badge>
      </div>

      <DataTable<Row>
        rows={rows}
        columns={[
          { key: 'team', label: 'Team' },
          {
            key: 'required',
            label: 'Required',
            render: (r) => (r.required ? <Badge tone="blue">Required</Badge> : <span className="subtle">—</span>),
          },
          {
            key: 'readiness',
            label: 'Readiness',
            render: (r) => <Badge tone={readinessTone(r.readiness)}>{r.readiness}%</Badge>,
          },
          {
            key: 'decision',
            label: 'Decision',
            render: (r) => (
              <select
                value={r.decision}
                onChange={(e) =>
                  update(profile.id, r.teamId, { decision: e.target.value as Decision })
                }
                style={{ minWidth: 190 }}
              >
                {DECISION_OPTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            ),
          },
          {
            key: 'decisionBadge',
            label: 'Status',
            render: (r) => <Badge tone={decisionTone(r.decision)}>{r.decision}</Badge>,
          },
          {
            key: 'owner',
            label: 'Owner',
            render: (r) => (
              <input
                value={r.owner}
                placeholder="—"
                style={{ minWidth: 120 }}
                onChange={(e) => update(profile.id, r.teamId, { owner: e.target.value })}
              />
            ),
          },
          {
            key: 'due',
            label: 'Due',
            render: (r) => (
              <input
                type="date"
                value={r.due}
                onChange={(e) => update(profile.id, r.teamId, { dueDate: e.target.value })}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
