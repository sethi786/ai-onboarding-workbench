import { computeScoreFromMap, METHODOLOGY_NOTE } from '../engine/scoring';
import { TEAM_LENSES } from '../data/teamLenses';
import type { ScoreResult } from '../types';
import type { Profile, TeamAssessment, TeamId } from '../types';
import { TEAM_IDS } from '../data/teamLenses';

export interface ProfileExport {
  kind: 'ai-workbench-profile';
  version: 2;
  methodologyNote: string;
  score: ScoreResult;
  profile: Profile;
  assessments: Record<string, TeamAssessment>;
}

export function toProfileJson(
  profile: Profile,
  getAssessment: (teamId: TeamId) => TeamAssessment,
  asOf?: string,
): string {
  const assessments: Record<string, TeamAssessment> = {};
  TEAM_IDS.forEach((id) => {
    assessments[id] = getAssessment(id);
  });
  const payload: ProfileExport = {
    kind: 'ai-workbench-profile',
    version: 2,
    methodologyNote: METHODOLOGY_NOTE,
    score: computeScoreFromMap(profile, TEAM_LENSES, assessments, asOf),
    profile,
    assessments,
  };
  return JSON.stringify(payload, null, 2);
}
