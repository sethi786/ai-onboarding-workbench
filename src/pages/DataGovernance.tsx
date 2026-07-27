import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function DataGovernance() {
  return (
    <TeamLensPage
      teamIds={['data-governance']}
      title="AI Data Governance"
      intro="What Data Governance validates: data sources, ownership, classification, lineage, permission trimming, and vector index lifecycle."
    />
  );
}
