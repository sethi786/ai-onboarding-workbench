import { useState } from 'react';
import { useActiveProfile } from '../hooks/useActiveProfile';
import { useScoring } from '../hooks/useScoring';
import { TEAM_LENSES } from '../data/teamLenses';
import { TeamLensCard } from '../features/selfEval/TeamLensCard';
import { EmptyState } from '../components/ui/EmptyState';
import { DISCLAIMER } from '../data/constants';

type Filter = 'all' | 'required' | 'blockers' | 'incomplete' | 'missing-evidence';

export default function SelfEvaluationCenter() {
  const profile = useActiveProfile();
  const score = useScoring(profile);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  if (!profile || !score) {
    return <EmptyState title="No profile selected" hint="Create a profile to start self-evaluating." />;
  }

  const lenses = TEAM_LENSES.filter((lens) => {
    const ts = score.perTeam[lens.id];
    if (query && !lens.title.toLowerCase().includes(query.toLowerCase())) return false;
    switch (filter) {
      case 'required':
        return ts.required;
      case 'blockers':
        return ts.activeBlockers > 0 || ts.hasCriticalBlocker;
      case 'incomplete':
        return ts.controlsComplete < ts.controlsTotal;
      case 'missing-evidence':
        return ts.evidenceComplete < ts.evidenceTotal;
      default:
        return true;
    }
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All teams' },
    { id: 'required', label: 'Required only' },
    { id: 'blockers', label: 'Blockers only' },
    { id: 'incomplete', label: 'Incomplete controls' },
    { id: 'missing-evidence', label: 'Missing evidence' },
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Self-Evaluation Center</h1>
        <p className="page-head__sub">
          Walk each review team, self-score 0–5, complete controls and evidence, and flag blockers.
          This is a deep-dive review simulator, not a questionnaire.
        </p>
      </div>

      <div className="disclaimer no-print">{DISCLAIMER}</div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search teams…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {filters.map((f) => (
          <button
            key={f.id}
            className={`btn btn--sm ${filter === f.id ? 'btn--primary' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className="subtle" style={{ marginLeft: 'auto', fontSize: 12 }}>
          {lenses.length} of {TEAM_LENSES.length} teams
        </span>
      </div>

      {lenses.length === 0 ? (
        <EmptyState title="No teams match this filter" hint="Try a different filter." />
      ) : (
        <div className="stack">
          {lenses.map((lens) => (
            <TeamLensCard
              key={lens.id}
              profileId={profile.id}
              lens={lens}
              teamScore={score.perTeam[lens.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
