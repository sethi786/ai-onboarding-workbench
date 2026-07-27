import type { TeamId } from '../../types';
import { LENS_BY_ID } from '../../data/teamLenses';
import { useActiveProfile } from '../../hooks/useActiveProfile';
import { useScoring } from '../../hooks/useScoring';
import { TeamLensCard } from './TeamLensCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { DISCLAIMER } from '../../data/constants';

interface Props {
  teamIds: TeamId[];
  title: string;
  intro?: string;
}

export function TeamLensPage({ teamIds, title, intro }: Props) {
  const profile = useActiveProfile();
  const score = useScoring(profile);

  if (!profile || !score) {
    return <EmptyState title="No profile selected" hint="Choose or create a profile to begin." />;
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{title}</h1>
        {intro && <p className="page-head__sub">{intro}</p>}
      </div>
      <div className="disclaimer no-print">{DISCLAIMER}</div>
      {teamIds.map((id) => (
        <TeamLensCard
          key={id}
          profileId={profile.id}
          lens={LENS_BY_ID[id]}
          teamScore={score.perTeam[id]}
          defaultOpen={teamIds.length === 1}
        />
      ))}
    </div>
  );
}
