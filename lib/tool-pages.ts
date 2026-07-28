import { TOOL_TEMPLATES, type ToolTemplate } from '@/data/tool-templates';
import { TEAM_LENSES, LENS_BY_ID } from '@/workbench/data/teamLenses';
import {
  isRequired,
  reviewDepth,
  baseDepth,
  controlsAtDepth,
  evidenceAtDepth,
} from '@/workbench/engine/reviewIntensity';
import { computeRisk } from '@/workbench/engine/scoring';
import type { Profile, ReviewDepth, TeamLens } from '@/workbench/types';

/**
 * Public pages for the tools people are actually trying to adopt.
 *
 * Somebody's real question is "what does a Microsoft 365 Copilot security
 * review involve" — typed into a search box, months before they have heard of
 * us. The library already holds the answer for fifteen tools: which reviews
 * apply, what each one asks, and where the risk sits. None of it was reachable
 * without an account.
 *
 * Everything here is derived from the same engine the product runs on, so these
 * pages cannot drift into marketing claims the tool doesn't back up.
 */

export interface ToolLensSummary {
  id: string;
  title: string;
  purpose: string;
  depth: ReviewDepth;
  controlCount: number;
  evidenceCount: number;
  /** The specific thing this lens tends to catch on this tool, when we know it. */
  note?: string;
}

export interface ToolPage {
  slug: string;
  name: string;
  vendor: string;
  category: string;
  summary: string;
  profile: Profile;
  depth: ReviewDepth;
  risk: string;
  lenses: ToolLensSummary[];
  skipped: string[];
  totalControls: number;
  totalEvidence: number;
  /** Capability facts a reviewer will ask about, in plain words. */
  characteristics: string[];
}

export function slugForTemplate(t: ToolTemplate): string {
  return t.id;
}

/**
 * A representative profile for the tool: the template's own defaults, filled
 * out enough to run the engine. This models a typical adoption, which is what
 * somebody researching the tool wants to see.
 */
function profileFor(t: ToolTemplate): Profile {
  return {
    id: t.id,
    name: t.name,
    platform: t.platform,
    toolCategory: t.defaults.toolCategory ?? 'AI / ML system',
    toolType: t.toolType,
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: t.defaults.dataTypes ?? [],
    dataClassification: t.defaults.dataClassification ?? 'Internal',
    environment: t.defaults.environment ?? 'Pilot',
    model: t.defaults.model ?? '',
    agentEnabled: t.defaults.agentEnabled ?? false,
    connectorEnabled: t.defaults.connectorEnabled ?? false,
    ragEnabled: t.defaults.ragEnabled ?? false,
    externalVendor: t.defaults.externalVendor ?? true,
    clientData: t.defaults.clientData ?? false,
    pii: t.defaults.pii ?? false,
    autonomousActions: t.defaults.autonomousActions ?? false,
    selfHosted: t.defaults.selfHosted ?? false,
    createdAt: '',
    updatedAt: '',
  };
}

function characteristicsOf(p: Profile): string[] {
  return [
    p.externalVendor && 'Runs on the vendor’s infrastructure',
    p.selfHosted && 'You host and patch it yourself',
    p.ragEnabled && 'Indexes or retrieves your content',
    p.connectorEnabled && 'Connects to other business systems',
    p.agentEnabled && 'Can plan and call tools on a user’s behalf',
    p.autonomousActions && 'Takes actions without per-action approval',
    p.pii && 'Handles personal data',
    p.clientData && 'Handles client data',
  ].filter(Boolean) as string[];
}

function lensSummary(lens: TeamLens, p: Profile, t: ToolTemplate): ToolLensSummary {
  const depth = reviewDepth(lens, p);
  const note = t.suggested[lens.id]?.notes;
  return {
    id: lens.id,
    title: lens.title,
    purpose: lens.reviewPurpose,
    depth,
    controlCount: controlsAtDepth(lens, depth).length,
    evidenceCount: evidenceAtDepth(lens, depth).length,
    note: note || undefined,
  };
}

export function buildToolPage(t: ToolTemplate): ToolPage {
  const profile = profileFor(t);
  const required = TEAM_LENSES.filter((l) => isRequired(l, profile));
  const lenses = required.map((l) => lensSummary(l, profile, t));

  return {
    slug: slugForTemplate(t),
    name: t.name,
    vendor: t.vendor,
    category: t.category,
    summary: t.summary,
    profile,
    depth: baseDepth(profile),
    risk: computeRisk(profile, false),
    lenses,
    skipped: TEAM_LENSES.filter((l) => !required.includes(l)).map((l) => LENS_BY_ID[l.id].title),
    totalControls: lenses.reduce((n, l) => n + l.controlCount, 0),
    totalEvidence: lenses.reduce((n, l) => n + l.evidenceCount, 0),
    characteristics: characteristicsOf(profile),
  };
}

export const TOOL_PAGES: ToolPage[] = TOOL_TEMPLATES.map(buildToolPage);

export const TOOL_PAGE_BY_SLUG: Record<string, ToolPage> = Object.fromEntries(
  TOOL_PAGES.map((p) => [p.slug, p]),
);
