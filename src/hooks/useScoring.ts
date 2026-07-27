import { useMemo } from 'react';
import { useWorkbenchStore } from '../store/useWorkbenchStore';
import { computeScoreFromMap } from '../engine/scoring';
import { TEAM_LENSES } from '../data/teamLenses';
import type { Profile, ScoreResult } from '../types';

/**
 * Memoized scoring for a profile. Recomputes when the profile or its
 * assessment slice changes. Returns null if no profile is given.
 */
export function useScoring(profile: Profile | null): ScoreResult | null {
  const assessments = useWorkbenchStore((s) =>
    profile ? s.assessments[profile.id] : undefined,
  );

  return useMemo(() => {
    if (!profile) return null;
    return computeScoreFromMap(profile, TEAM_LENSES, assessments ?? {});
  }, [profile, assessments]);
}
