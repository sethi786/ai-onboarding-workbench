import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { useProfiles } from '../hooks/useActiveProfile';
import { computeScoreFromMap } from '../engine/scoring';
import { TEAM_LENSES } from '../data/teamLenses';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { riskTone, approvalTone, readinessTone } from '../components/ui/statusColors';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  platform: string;
  environment: string;
  readiness: number;
  risk: string;
  approval: string;
  blockers: number;
}

export default function IntakeRegister() {
  const profiles = useProfiles();
  const assessments = useWorkbenchStore((s) => s.assessments);
  const setActive = useWorkbenchStore((s) => s.setActiveProfile);

  const rows: Row[] = profiles.map((p) => {
    const score = computeScoreFromMap(p, TEAM_LENSES, assessments[p.id] ?? {});
    return {
      id: p.id,
      name: p.name,
      platform: p.platform,
      environment: p.environment,
      readiness: score.readiness,
      risk: score.risk,
      approval: score.approvalStatus,
      blockers: score.blockersCount,
    };
  });

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Intake Register</h1>
        <p className="page-head__sub">
          Every AI use case being self-evaluated, with live readiness, risk, and approval status.
        </p>
      </div>

      <DataTable<Row>
        rows={rows}
        empty="No profiles yet."
        columns={[
          {
            key: 'name',
            label: 'Profile',
            render: (r) => (
              <button className="btn btn--sm" onClick={() => setActive(r.id)}>
                {r.name}
              </button>
            ),
          },
          { key: 'platform', label: 'Platform' },
          { key: 'environment', label: 'Environment' },
          {
            key: 'readiness',
            label: 'Readiness',
            render: (r) => <Badge tone={readinessTone(r.readiness)}>{r.readiness}/100</Badge>,
          },
          { key: 'risk', label: 'Risk', render: (r) => <Badge tone={riskTone(r.risk as never)}>{r.risk}</Badge> },
          {
            key: 'approval',
            label: 'Approval',
            render: (r) => <Badge tone={approvalTone(r.approval as never)}>{r.approval}</Badge>,
          },
          {
            key: 'blockers',
            label: 'Blockers',
            render: (r) =>
              r.blockers > 0 ? <Badge tone="red">{r.blockers}</Badge> : <span className="subtle">0</span>,
          },
        ]}
      />
    </div>
  );
}
