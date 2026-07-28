import type { Profile, TeamAssessment, TeamId, TeamLens } from '../types';
import type { Framework, FrameworkClause } from '../data/frameworks';
import { frameworksFor } from '../data/frameworks';
import { isRequired, reviewDepth, controlsAtDepth, evidenceAtDepth } from './reviewIntensity';

/**
 * How much of a regulatory obligation this review has actually evidenced.
 *
 * Deliberately conservative in two ways. A clause counts as addressed only
 * through lenses that are *required* for this tool — evidence from a review
 * nobody has to do is not evidence. And an unanswered control counts as
 * nothing, never as "probably fine": the entire value of handing this to an
 * auditor is that the gaps are honest.
 */

export type ClauseStatus = 'covered' | 'partial' | 'open' | 'out-of-scope';

export interface ClauseCoverage {
  clause: FrameworkClause;
  status: ClauseStatus;
  /** 0..1 — share of the mapped, required controls and evidence answered. */
  completeness: number;
  /** Lenses that evidence this clause and are required for this tool. */
  contributingLenses: { id: TeamId; title: string; completeness: number }[];
  /** Mapped lenses that don't apply here, so the reviewer knows why. */
  inapplicableLenses: string[];
  /** Named gaps a reviewer can act on. */
  openItems: string[];
}

export interface FrameworkCoverage {
  framework: Framework;
  clauses: ClauseCoverage[];
  covered: number;
  partial: number;
  open: number;
  /** 0..1 across in-scope clauses only. */
  completeness: number;
}

function lensCompleteness(
  lens: TeamLens,
  profile: Profile,
  assessment: TeamAssessment,
): { done: number; total: number; open: string[] } {
  const depth = reviewDepth(lens, profile);
  const controls = controlsAtDepth(lens, depth);
  const evidence = evidenceAtDepth(lens, depth);

  const open: string[] = [];
  let done = 0;
  for (const c of controls) {
    if (assessment.checkedControls[c.id]) done++;
    else open.push(`${lens.title}: ${c.label}`);
  }
  for (const e of evidence) {
    if (assessment.checkedEvidence[e.id]) done++;
    else open.push(`${lens.title}: ${e.label}`);
  }
  return { done, total: controls.length + evidence.length, open };
}

export function coverageFor(
  framework: Framework,
  profile: Profile,
  lenses: TeamLens[],
  getAssessment: (id: TeamId) => TeamAssessment,
): FrameworkCoverage {
  const byId = new Map(lenses.map((l) => [l.id, l]));

  const clauses: ClauseCoverage[] = framework.clauses.map((clause) => {
    const contributing: ClauseCoverage['contributingLenses'] = [];
    const inapplicable: string[] = [];
    const openItems: string[] = [];
    let done = 0;
    let total = 0;

    for (const lensId of clause.lenses) {
      const lens = byId.get(lensId);
      if (!lens) continue;
      if (!isRequired(lens, profile)) {
        inapplicable.push(lens.title);
        continue;
      }
      const c = lensCompleteness(lens, profile, getAssessment(lensId));
      done += c.done;
      total += c.total;
      openItems.push(...c.open);
      contributing.push({
        id: lensId,
        title: lens.title,
        completeness: c.total === 0 ? 1 : c.done / c.total,
      });
    }

    // No required lens evidences this clause for this tool. That is a real
    // answer — "your review does not touch this obligation" — not a zero.
    if (contributing.length === 0) {
      return {
        clause,
        status: 'out-of-scope',
        completeness: 0,
        contributingLenses: [],
        inapplicableLenses: inapplicable,
        openItems: [],
      };
    }

    const completeness = total === 0 ? 1 : done / total;
    const status: ClauseStatus =
      completeness >= 0.999 ? 'covered' : completeness > 0 ? 'partial' : 'open';

    return {
      clause,
      status,
      completeness,
      contributingLenses: contributing,
      inapplicableLenses: inapplicable,
      // Enough to act on without turning the page into a wall of text.
      openItems: openItems.slice(0, 8),
    };
  });

  const inScope = clauses.filter((c) => c.status !== 'out-of-scope');
  return {
    framework,
    clauses,
    covered: clauses.filter((c) => c.status === 'covered').length,
    partial: clauses.filter((c) => c.status === 'partial').length,
    open: clauses.filter((c) => c.status === 'open').length,
    completeness:
      inScope.length === 0
        ? 0
        : inScope.reduce((n, c) => n + c.completeness, 0) / inScope.length,
  };
}

export function allCoverage(
  profile: Profile,
  lenses: TeamLens[],
  getAssessment: (id: TeamId) => TeamAssessment,
): FrameworkCoverage[] {
  return frameworksFor(profile).map((f) => coverageFor(f, profile, lenses, getAssessment));
}
