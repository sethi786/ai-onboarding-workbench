import { useMemo, useState } from 'react';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useScoring } from '../hooks/useScoring';
import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { EmptyState } from '../components/ui/EmptyState';
import { buildReportContext } from '../export/reportContext';
import { EVIDENCE_ARTIFACTS } from '../export/evidenceFactory';
import { download, slug } from '../export/download';
import { DRAFT_BANNER } from '../data/constants';

export default function EvidenceFactory() {
  const profile = useActiveProfile();
  const score = useScoring(profile);
  const getAssessment = useWorkbenchStore((s) => s.getAssessment);
  const [selected, setSelected] = useState<string>(EVIDENCE_ARTIFACTS[0].id);

  const ctx = useMemo(() => {
    if (!profile || !score) return null;
    return buildReportContext(
      profile,
      score,
      (teamId) => getAssessment(profile.id, teamId),
      new Date().toISOString(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, score]);

  if (!profile || !score || !ctx) {
    return <EmptyState title="No profile selected" hint="Create a profile to generate artifacts." />;
  }

  const artifact = EVIDENCE_ARTIFACTS.find((a) => a.id === selected)!;
  const content = artifact.build(ctx);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Evidence Factory</h1>
        <p className="page-head__sub">
          Generate draft review artifacts from this profile’s data and self-assessment. Use them to
          prepare for the real reviews.
        </p>
      </div>

      <div className="disclaimer no-print">⚠️ {DRAFT_BANNER}</div>

      <div className="grid" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
        <div className="card">
          <div className="card__head">
            <span className="card__title">Artifacts</span>
            <span className="acc__count">{EVIDENCE_ARTIFACTS.length}</span>
          </div>
          <div className="card__body" style={{ padding: 8 }}>
            {EVIDENCE_ARTIFACTS.map((a, i) => (
              <button
                key={a.id}
                className={`nav-link ${a.id === selected ? 'active' : ''}`}
                style={{ color: a.id === selected ? '#fff' : 'var(--c-text)', width: '100%' }}
                onClick={() => setSelected(a.id)}
              >
                <span className="nav-link__icon">{i + 1}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <span className="card__title">{artifact.title}</span>
            <div className="btn-row" style={{ marginLeft: 'auto' }}>
              <button
                className="btn btn--sm"
                onClick={() => navigator.clipboard?.writeText(content)}
              >
                Copy
              </button>
              <button
                className="btn btn--sm btn--primary"
                onClick={() =>
                  download(
                    `${slug(profile.name)}-${artifact.id}.md`,
                    'text/markdown',
                    content,
                  )
                }
              >
                Download .md
              </button>
            </div>
          </div>
          <div className="card__body">
            <div className="pre">{content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
