import type { Profile, TeamAssessment, TeamId } from '../types';
import { TEAM_IDS } from '../data/teamLenses';

export interface ProfileExport {
  kind: 'ai-workbench-profile';
  version: 1;
  profile: Profile;
  assessments: Record<string, TeamAssessment>;
}

export function toProfileJson(
  profile: Profile,
  getAssessment: (teamId: TeamId) => TeamAssessment,
): string {
  const assessments: Record<string, TeamAssessment> = {};
  TEAM_IDS.forEach((id) => {
    assessments[id] = getAssessment(id);
  });
  const payload: ProfileExport = {
    kind: 'ai-workbench-profile',
    version: 1,
    profile,
    assessments,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseProfileJson(text: string): ProfileExport {
  const data = JSON.parse(text);
  if (data?.kind !== 'ai-workbench-profile' || !data.profile) {
    throw new Error('Not a valid AI Workbench profile export.');
  }
  return data as ProfileExport;
}
