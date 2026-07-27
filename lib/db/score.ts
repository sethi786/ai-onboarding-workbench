import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import type { ScoreResult } from '@/workbench/types';
import { loadAssessmentMap, rowToProfile } from './queries';
import type { EvaluationRow } from './types';

/** Load an evaluation's assessments and run the pure engine (server-side). */
export async function scoreEvaluation(row: EvaluationRow): Promise<ScoreResult> {
  const map = await loadAssessmentMap(row.id);
  return computeScoreFromMap(rowToProfile(row), TEAM_LENSES, map);
}
