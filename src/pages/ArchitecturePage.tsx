import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function ArchitecturePage() {
  return (
    <TeamLensPage
      teamIds={['enterprise-architecture', 'solution-architecture']}
      title="Architecture"
      intro="What Enterprise and Solution Architecture validate: strategic fit, build-vs-buy, platform alignment, integration, scalability, system design, resilience, and observability."
    />
  );
}
