import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import type { ScoreResult } from '@/workbench/types';
import { loadAssessmentMap, rowToProfile } from './queries';
import type { EvaluationRow } from './types';

/**
 * Load an evaluation's assessments and run the pure engine (server-side).
 *
 * The clearance date goes in with everything else, so a portfolio row for a
 * tool whose approval lapsed reads "Recertification Due" rather than the
 * "Proceed" it earned eighteen months ago.
 */
export async function scoreEvaluation(row: EvaluationRow): Promise<ScoreResult> {
  const map = await loadAssessmentMap(row.id);
  return computeScoreFromMap(rowToProfile(row), TEAM_LENSES, map, {
    validUntil: row.review_valid_until,
    today: new Date().toISOString().slice(0, 10),
  });
}
