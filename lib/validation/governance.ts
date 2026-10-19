import { DATA_CLASSIFICATIONS, ENVIRONMENTS, DECISION_OPTIONS } from '@/workbench/data/constants';
import { TOOL_CATEGORIES, PROJECT_TYPES_BY_CATEGORY } from '@/workbench/types';
import { LENS_BY_ID } from '@/workbench/data/teamLenses';
import type { TeamId } from '@/workbench/types';

type Check = (v: unknown) => boolean;
const text = (max: number): Check => (v) => typeof v === 'string' && v.length <= max;
const bool: Check = (v) => typeof v === 'boolean';
const choice = (values: readonly string[]): Check => (v) => typeof v === 'string' && values.includes(v);
export const validDate: Check = (v) => typeof v === 'string' && (v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v));
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const flags = (ids: string[]): Check => (v) => record(v) && Object.entries(v).every(([k, value]) => ids.includes(k) && bool(value));

function validate(value: unknown, rules: Record<string, Check>): string | null {
  if (!record(value) || !Object.keys(value).length) return 'Provide at least one field to update.';
  for (const [key, v] of Object.entries(value)) {
    if (!Object.hasOwn(rules, key)) return `Field cannot be changed: ${key}.`;
    if (!rules[key](v)) return `Invalid value for ${key}.`;
  }
  return null;
}

export function validateProfilePatch(value: unknown): string | null {
  return validate(value, {
    name: (v) => text(200)(v) && (v as string).trim().length > 0,
    platform: text(200), toolCategory: choice(TOOL_CATEGORIES), toolType: choice(Object.values(PROJECT_TYPES_BY_CATEGORY).flat()),
    useCase: text(10000), businessOwner: text(200), technicalOwner: text(200), executiveSponsor: text(200), targetUsers: text(1000),
    dataTypes: (v) => Array.isArray(v) && v.length <= 50 && v.every(text(200)),
    dataClassification: choice(DATA_CLASSIFICATIONS), environment: choice(ENVIRONMENTS), model: text(200),
    agentEnabled: bool, connectorEnabled: bool, ragEnabled: bool, externalVendor: bool, clientData: bool, pii: bool, autonomousActions: bool, selfHosted: bool,
  });
}

export function validateAssessmentPatch(teamId: string, value: unknown): string | null {
  const lens = Object.hasOwn(LENS_BY_ID, teamId) ? LENS_BY_ID[teamId as TeamId] : undefined;
  if (!lens) return 'Unknown review team.';
  return validate(value, {
    score: (v) => typeof v === 'number' && Number.isInteger(v) && v >= -1 && v <= 5,
    checkedControls: flags(lens.requiredControls.map((c) => c.id)), checkedEvidence: flags(lens.evidenceRequired.map((e) => e.id)), activeBlockers: flags(lens.blockers.map((b) => b.id)),
    markedLearned: bool, needsRemediation: bool, requiresFormalApproval: bool,
    notes: text(10000), owner: text(200), dueDate: validDate, residualRisk: text(10000), decision: choice(DECISION_OPTIONS),
  });
}

export function validateWorkflowPatch(value: unknown): string | null {
  return validate(value, {
    status: choice(['Not Started', 'In Progress', 'Complete', 'Blocked', 'Skipped']),
    decision: choice(DECISION_OPTIONS), owner: text(200), dueDate: validDate, evidence: text(10000), notes: text(10000), blocker: text(10000),
  });
}
