import type {
  DocumentBrand,
  Profile,
  ScoreResult,
  TeamAssessment,
  TeamId,
  TeamLens,
} from '../types';
import { TEAM_LENSES, LENS_BY_ID } from '../data/teamLenses';
import { DRAFT_BANNER } from '../data/constants';

export interface TeamReportRow {
  lens: TeamLens;
  assessment: TeamAssessment;
  required: boolean;
  escalated: boolean;
  normalized: number;
  controlsComplete: number;
  controlsTotal: number;
  evidenceComplete: number;
  evidenceTotal: number;
  activeBlockerLabels: string[];
  missingEvidence: string[];
  hasCriticalBlocker: boolean;
}

export interface ReportContext {
  profile: Profile;
  score: ScoreResult;
  teams: TeamReportRow[];
  generatedAt: string;
  /** Undefined only in contexts with no workspace, e.g. the public landing demo. */
  brand?: DocumentBrand;
}

export function buildReportContext(
  profile: Profile,
  score: ScoreResult,
  getAssessment: (teamId: TeamId) => TeamAssessment,
  generatedAt: string,
  brand?: DocumentBrand,
): ReportContext {
  const teams: TeamReportRow[] = TEAM_LENSES.map((lens) => {
    const a = getAssessment(lens.id);
    const ts = score.perTeam[lens.id];
    const activeBlockerLabels = lens.blockers
      .filter((b) => a.activeBlockers[b.id])
      .map((b) => b.label + (b.critical ? ' (critical)' : ''));
    const missingEvidence = lens.evidenceRequired
      .filter((e) => !a.checkedEvidence[e.id])
      .map((e) => e.label);
    return {
      lens,
      assessment: a,
      required: ts.required,
      escalated: ts.escalated,
      normalized: ts.normalized,
      controlsComplete: ts.controlsComplete,
      controlsTotal: ts.controlsTotal,
      evidenceComplete: ts.evidenceComplete,
      evidenceTotal: ts.evidenceTotal,
      activeBlockerLabels,
      missingEvidence,
      hasCriticalBlocker: ts.hasCriticalBlocker,
    };
  });

  return { profile, score, teams, generatedAt, brand };
}

/** Shared header/footer inputs, so every artifact stamps the same masthead. */
export function headerMeta(ctx: ReportContext) {
  return {
    toolName: ctx.profile.name,
    platform: ctx.profile.platform,
    environment: ctx.profile.environment,
    classification: ctx.profile.dataClassification,
    generatedAt: ctx.generatedAt,
  };
}

export { DRAFT_BANNER, LENS_BY_ID };
