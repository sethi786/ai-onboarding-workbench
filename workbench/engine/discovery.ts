import type { Profile, ToolCategory } from '../types';
import { TOOL_TEMPLATES, type ToolTemplate } from '../../data/tool-templates';

/**
 * Turning "what are we actually running?" into a review queue.
 *
 * Governance products that start with a blank form ask the customer to type
 * their tools in from memory, which is exactly the population that already
 * doesn't know — reportedly more than 60% of SaaS and AI tools run outside IT
 * visibility. The whole current generation of this category starts with
 * discovery instead, and this is the version of that Aegis can do honestly:
 * paste the lists you already have — SSO applications, an expense export, a
 * browser extension inventory — and get back a risk-ranked queue.
 *
 * Matching is deterministic against the template library and a catalogue of
 * common tools, so this works with no API key at all. The AI layer only
 * classifies the lines that didn't match, which is where it adds something a
 * lookup table can't.
 */

export interface KnownTool {
  name: string;
  vendor: string;
  category: ToolCategory;
  /** Lowercase substrings that identify this tool in a messy export. */
  aliases: string[];
  /** True when the tool's core function is AI — drives the shadow-AI flag. */
  ai: boolean;
}

/**
 * Common tools beyond the prefilled template library. Deliberately weighted
 * toward the AI tools people adopt without asking, since those are what a
 * discovery pass is for.
 */
const CATALOGUE: KnownTool[] = [
  { name: 'Notion AI', vendor: 'Notion', category: 'AI / ML system', ai: true, aliases: ['notion'] },
  { name: 'Grammarly', vendor: 'Grammarly', category: 'AI / ML system', ai: true, aliases: ['grammarly'] },
  { name: 'Otter.ai', vendor: 'Otter.ai', category: 'AI / ML system', ai: true, aliases: ['otter.ai', 'otter ai'] },
  { name: 'Fireflies.ai', vendor: 'Fireflies', category: 'AI / ML system', ai: true, aliases: ['fireflies'] },
  { name: 'Gamma', vendor: 'Gamma', category: 'AI / ML system', ai: true, aliases: ['gamma.app'] },
  { name: 'Midjourney', vendor: 'Midjourney', category: 'AI / ML system', ai: true, aliases: ['midjourney'] },
  { name: 'Jasper', vendor: 'Jasper', category: 'AI / ML system', ai: true, aliases: ['jasper.ai', 'jasper'] },
  { name: 'Synthesia', vendor: 'Synthesia', category: 'AI / ML system', ai: true, aliases: ['synthesia'] },
  { name: 'DeepL', vendor: 'DeepL', category: 'AI / ML system', ai: true, aliases: ['deepl'] },
  { name: 'Zoom', vendor: 'Zoom', category: 'SaaS application', ai: false, aliases: ['zoom.us', 'zoom'] },
  { name: 'Atlassian Jira', vendor: 'Atlassian', category: 'SaaS application', ai: false, aliases: ['jira', 'atlassian'] },
  { name: 'Confluence', vendor: 'Atlassian', category: 'SaaS application', ai: false, aliases: ['confluence'] },
  { name: 'HubSpot', vendor: 'HubSpot', category: 'SaaS application', ai: false, aliases: ['hubspot'] },
  { name: 'Zendesk', vendor: 'Zendesk', category: 'SaaS application', ai: false, aliases: ['zendesk'] },
  { name: 'Asana', vendor: 'Asana', category: 'SaaS application', ai: false, aliases: ['asana'] },
  { name: 'Monday.com', vendor: 'monday.com', category: 'SaaS application', ai: false, aliases: ['monday.com'] },
  { name: 'Dropbox', vendor: 'Dropbox', category: 'SaaS application', ai: false, aliases: ['dropbox'] },
  { name: 'Box', vendor: 'Box', category: 'SaaS application', ai: false, aliases: ['box.com'] },
  { name: 'DocuSign', vendor: 'DocuSign', category: 'SaaS application', ai: false, aliases: ['docusign'] },
  { name: 'Okta', vendor: 'Okta', category: 'SaaS application', ai: false, aliases: ['okta'] },
  { name: 'Datadog', vendor: 'Datadog', category: 'PaaS / cloud service', ai: false, aliases: ['datadog'] },
  { name: 'Amazon Web Services', vendor: 'AWS', category: 'PaaS / cloud service', ai: false, aliases: ['aws', 'amazon web services'] },
  { name: 'Google Cloud Platform', vendor: 'Google', category: 'PaaS / cloud service', ai: false, aliases: ['gcp', 'google cloud'] },
  { name: 'Microsoft Azure', vendor: 'Microsoft', category: 'PaaS / cloud service', ai: false, aliases: ['azure'] },
];

export type MatchSource = 'library' | 'catalogue' | 'unmatched';

export interface DiscoveredTool {
  /** The raw line it came from, so the user can see what produced this. */
  raw: string;
  name: string;
  vendor: string;
  category: ToolCategory;
  /** Set when this matched a prefilled library template, which is the best case. */
  templateId?: string;
  source: MatchSource;
  ai: boolean;
  /** True when nothing in the org has reviewed it and it is AI. */
  shadowAi: boolean;
}

/** Strip the noise a real export carries: counts, dates, emails, URLs, quoting. */
function cleanLine(line: string): string {
  return line
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[\w.+-]+@[\w.-]+/g, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/[",;|\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function templateAliases(t: ToolTemplate): string[] {
  return [t.name.toLowerCase(), t.platform.toLowerCase(), t.id.replace(/-/g, ' ')];
}

/**
 * Longest alias wins, so "Microsoft 365 Copilot" beats a bare "copilot" and
 * "GitHub Copilot" doesn't get swallowed by either.
 */
function bestMatch(haystack: string): DiscoveredTool | null {
  let best: { tool: Omit<DiscoveredTool, 'raw' | 'shadowAi'>; len: number } | null = null;

  for (const t of TOOL_TEMPLATES) {
    for (const alias of templateAliases(t)) {
      if (alias.length > 2 && haystack.includes(alias) && (!best || alias.length > best.len)) {
        best = {
          len: alias.length,
          tool: {
            name: t.name,
            vendor: t.vendor,
            category: (t.defaults.toolCategory ?? 'AI / ML system') as ToolCategory,
            templateId: t.id,
            source: 'library',
            ai: (t.defaults.toolCategory ?? 'AI / ML system') === 'AI / ML system',
          },
        };
      }
    }
  }

  for (const k of CATALOGUE) {
    for (const alias of k.aliases) {
      if (haystack.includes(alias) && (!best || alias.length > best.len)) {
        best = {
          len: alias.length,
          tool: { name: k.name, vendor: k.vendor, category: k.category, source: 'catalogue', ai: k.ai },
        };
      }
    }
  }

  return best ? { ...best.tool, raw: '', shadowAi: false } : null;
}

export interface DiscoverOptions {
  /** Tool names already under review, so the queue only shows what's new. */
  alreadyReviewed?: string[];
}

/**
 * Parse a pasted export into candidate tools.
 *
 * Unmatched lines are kept rather than dropped: a line this can't identify is
 * still something running in the business, and silently discarding it would
 * make the inventory look cleaner than it is.
 */
export function discoverFromText(text: string, opts: DiscoverOptions = {}): DiscoveredTool[] {
  const reviewed = new Set((opts.alreadyReviewed ?? []).map((n) => n.trim().toLowerCase()));
  const seen = new Set<string>();
  const out: DiscoveredTool[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const raw = cleanLine(rawLine);
    if (raw.length < 2) continue;

    const hay = raw.toLowerCase();
    const match = bestMatch(hay);

    const tool: DiscoveredTool = match
      ? { ...match, raw }
      : {
          raw,
          // Keep the user's own wording; a guessed vendor would be a fabrication.
          name: raw.slice(0, 80),
          vendor: '',
          category: 'SaaS application',
          source: 'unmatched',
          ai: false,
          shadowAi: false,
        };

    const key = tool.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    tool.shadowAi = tool.ai && !reviewed.has(key);
    out.push(tool);
  }

  return out;
}

/**
 * A provisional profile for ranking, built only from what discovery knows.
 *
 * Assumes production and confidential data on purpose: an undiscovered tool is
 * being used by somebody right now on unknown data, and ranking it as a
 * harmless sandbox trial would defeat the point of looking.
 */
export function provisionalProfile(tool: DiscoveredTool): Profile {
  const template = tool.templateId
    ? TOOL_TEMPLATES.find((t) => t.id === tool.templateId)
    : undefined;

  return {
    id: `discovered-${tool.name}`,
    name: tool.name,
    platform: tool.vendor || tool.name,
    toolCategory: tool.category,
    toolType: template?.toolType ?? 'Business SaaS application',
    useCase: '',
    businessOwner: '',
    technicalOwner: '',
    executiveSponsor: '',
    targetUsers: '',
    dataTypes: template?.defaults.dataTypes ?? [],
    dataClassification: template?.defaults.dataClassification ?? 'Confidential',
    environment: 'Production',
    model: template?.defaults.model ?? '',
    agentEnabled: template?.defaults.agentEnabled ?? false,
    connectorEnabled: template?.defaults.connectorEnabled ?? true,
    ragEnabled: template?.defaults.ragEnabled ?? tool.ai,
    externalVendor: template?.defaults.externalVendor ?? true,
    clientData: template?.defaults.clientData ?? false,
    pii: template?.defaults.pii ?? false,
    autonomousActions: template?.defaults.autonomousActions ?? false,
    selfHosted: template?.defaults.selfHosted ?? false,
    createdAt: '',
    updatedAt: '',
  };
}
