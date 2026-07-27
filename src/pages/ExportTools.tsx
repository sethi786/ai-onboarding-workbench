import { useActiveProfile } from '../hooks/useActiveProfile';
import { useScoring } from '../hooks/useScoring';
import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { EmptyState } from '../components/ui/EmptyState';
import { buildReportContext } from '../export/reportContext';
import { toMarkdownReport } from '../export/toMarkdownReport';
import { toCsv } from '../export/toCsv';
import { toProfileJson } from '../export/toJson';
import { toGoNoGoReport } from '../export/toGoNoGoReport';
import { toRemediationPlan } from '../export/toRemediationPlan';
import { download, slug } from '../export/download';
import { Badge } from '../components/ui/Badge';
import { recommendationTone } from '../components/ui/statusColors';

export default function ExportTools() {
  const profile = useActiveProfile();
  const score = useScoring(profile);
  const getAssessment = useWorkbenchStore((s) => s.getAssessment);

  if (!profile || !score) {
    return <EmptyState title="No profile selected" hint="Create a profile to export reports." />;
  }

  const ctx = buildReportContext(
    profile,
    score,
    (teamId) => getAssessment(profile.id, teamId),
    new Date().toISOString(),
  );
  const base = slug(profile.name);

  const actions: { label: string; run: () => void }[] = [
    {
      label: 'Export JSON (profile + assessments)',
      run: () =>
        download(`${base}-profile.json`, 'application/json', toProfileJson(profile, (t) => getAssessment(profile.id, t))),
    },
    { label: 'Export CSV (team status)', run: () => download(`${base}-status.csv`, 'text/csv', toCsv(ctx)) },
    {
      label: 'Export Markdown report',
      run: () => download(`${base}-report.md`, 'text/markdown', toMarkdownReport(ctx)),
    },
    {
      label: 'Generate Go/No-Go report',
      run: () => download(`${base}-go-no-go.md`, 'text/markdown', toGoNoGoReport(ctx)),
    },
    {
      label: 'Generate Remediation plan',
      run: () => download(`${base}-remediation.md`, 'text/markdown', toRemediationPlan(ctx)),
    },
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Export & Tools</h1>
        <p className="page-head__sub">
          Download machine-readable data and print-ready reports for {profile.name}.
        </p>
      </div>

      <div className="row wrap" style={{ gap: 12 }}>
        <Badge tone={recommendationTone(score.recommendation)}>{score.recommendation}</Badge>
        <span className="muted">
          Readiness {score.readiness}/100 · Risk {score.risk} · Evidence {score.evidenceCompleteness}%
        </span>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__head">
            <span className="card__title">Downloads</span>
          </div>
          <div className="card__body btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {actions.map((a) => (
              <button key={a.label} className="btn" style={{ justifyContent: 'flex-start' }} onClick={a.run}>
                ⬇ {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <span className="card__title">Print</span>
          </div>
          <div className="card__body btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn btn--primary" style={{ justifyContent: 'flex-start' }} onClick={() => window.print()}>
              🖨 Print current view / Save as PDF
            </button>
            <p className="subtle" style={{ fontSize: 12 }}>
              The sidebar and controls are hidden when printing. Open the Executive Dashboard or
              Self-Evaluation Center first for a full report, then print.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
