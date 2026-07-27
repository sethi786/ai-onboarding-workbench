import { useActiveProfile } from '../hooks/useActiveProfile';
import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { stageTone } from '../components/ui/statusColors';
import type { StageStatus, Decision } from '../types';

const STATUSES: StageStatus[] = ['Not Started', 'In Progress', 'Complete', 'Blocked', 'Skipped'];
const DECISIONS: Decision[] = [
  'Not Reviewed',
  'Approved',
  'Approved with Conditions',
  'Needs Remediation',
  'Blocked',
];

export default function WorkflowStages() {
  const profile = useActiveProfile();
  const workflow = useWorkbenchStore((s) => (profile ? s.workflow[profile.id] : undefined));
  const getWorkflow = useWorkbenchStore((s) => s.getWorkflow);
  const updateStage = useWorkbenchStore((s) => s.updateWorkflowStage);

  if (!profile) {
    return <EmptyState title="No profile selected" hint="Create a profile to track workflow stages." />;
  }

  const stages = workflow ?? getWorkflow(profile.id);
  const complete = stages.filter((s) => s.status === 'Complete').length;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Workflow Stages</h1>
        <p className="page-head__sub">
          The end-to-end onboarding lifecycle from intake to retirement. Track status, owner, due
          date, evidence, and decision per stage.
        </p>
      </div>

      <div className="row">
        <Badge tone="blue">
          {complete}/{stages.length} stages complete
        </Badge>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Evidence</th>
              <th>Decision</th>
              <th>Blocker / Notes</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((st) => (
              <tr key={st.id}>
                <td className="subtle">{st.order}</td>
                <td style={{ fontWeight: 600 }}>{st.name}</td>
                <td>
                  <select
                    value={st.status}
                    onChange={(e) =>
                      updateStage(profile.id, st.id, { status: e.target.value as StageStatus })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: 4 }}>
                    <Badge tone={stageTone(st.status)}>{st.status}</Badge>
                  </div>
                </td>
                <td>
                  <input
                    value={st.owner}
                    style={{ minWidth: 110 }}
                    onChange={(e) => updateStage(profile.id, st.id, { owner: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={st.dueDate}
                    onChange={(e) => updateStage(profile.id, st.id, { dueDate: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={st.evidence}
                    placeholder="link / ref"
                    style={{ minWidth: 120 }}
                    onChange={(e) => updateStage(profile.id, st.id, { evidence: e.target.value })}
                  />
                </td>
                <td>
                  <select
                    value={st.decision}
                    onChange={(e) =>
                      updateStage(profile.id, st.id, { decision: e.target.value as Decision })
                    }
                  >
                    {DECISIONS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    value={st.blocker}
                    placeholder="notes / blocker"
                    style={{ minWidth: 140 }}
                    onChange={(e) => updateStage(profile.id, st.id, { blocker: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
