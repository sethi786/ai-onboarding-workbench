'use server';

import { requireUser } from '@/lib/auth/require-user';
import { getOrgPlan } from '@/lib/auth/entitlements';
import { createClient } from '@/lib/supabase/server';
import { isAiFailure } from '@/lib/ai/client';
import { guardAiCall } from '@/lib/ai/governance';
import { classifyUnknownTools } from '@/lib/ai/assist';
import { discoverFromText, provisionalProfile, type DiscoveredTool } from '@/workbench/engine/discovery';
import { computeRisk } from '@/workbench/engine/scoring';
import { TEAM_LENSES } from '@/workbench/data/teamLenses';
import { isRequired, baseDepth, reviewDepth, controlsAtDepth } from '@/workbench/engine/reviewIntensity';
import type { ToolCategory } from '@/workbench/types';

export interface RankedDiscovery extends DiscoveredTool {
  risk: string;
  depth: string;
  lensCount: number;
  controlCount: number;
  /** True when the AI layer identified this rather than the catalogue. */
  identifiedByAi?: boolean;
}

const MAX_INVENTORY_CHARS = 60_000;
/** Bounded because the leftovers go into a paid API call. */
const MAX_AI_LINES = 60;

const RISK_ORDER = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Turn a pasted inventory into a risk-ranked review queue.
 *
 * The deterministic pass does the identifying, so this returns something useful
 * with no API key at all. AI only sees the lines nothing recognised.
 */
export async function discoverTools(
  orgId: string,
  inventory: string,
): Promise<{ error?: string; tools?: RankedDiscovery[]; usedAi?: boolean }> {
  await requireUser();

  // Membership check: an RLS-scoped read is what proves access to this org.
  const plan = await getOrgPlan(orgId);
  if (plan === null) return { error: 'Workspace not found.' };

  const text = inventory.trim();
  if (text.length < 3) return { error: 'Paste a list of tools to scan.' };
  if (text.length > MAX_INVENTORY_CHARS) {
    return { error: 'That inventory is too large. Paste it in a couple of batches.' };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('evaluations')
    .select('name')
    .eq('org_id', orgId);

  let found = discoverFromText(text, {
    alreadyReviewed: (existing ?? []).map((e) => e.name),
  });

  // Hand the leftovers to the model — the part a lookup table can't do.
  let usedAi = false;
  const unmatched = found.filter((t) => t.source === 'unmatched');
  const gate =
    unmatched.length > 0
      ? await guardAiCall(orgId, 'inventory classification', text, { type: 'organization', id: orgId })
      : { ok: false as const };
  if (gate.ok && unmatched.length > 0) {
    const res = await classifyUnknownTools(unmatched.slice(0, MAX_AI_LINES).map((t) => t.raw));
    if (!isAiFailure(res)) {
      usedAi = true;
      const byRaw = new Map(res.data.tools.map((t) => [t.raw, t]));
      const reviewed = new Set((existing ?? []).map((e) => e.name.trim().toLowerCase()));
      found = found.map((t) => {
        const hit = t.source === 'unmatched' ? byRaw.get(t.raw) : undefined;
        if (!hit) return t;
        return {
          ...t,
          name: hit.name || t.name,
          vendor: hit.vendor,
          category: hit.toolCategory as ToolCategory,
          ai: hit.ai,
          shadowAi: hit.ai && !reviewed.has((hit.name || t.name).trim().toLowerCase()),
        };
      });
    }
  }

  const ranked: RankedDiscovery[] = found.map((tool) => {
    const p = provisionalProfile(tool);
    const required = TEAM_LENSES.filter((l) => isRequired(l, p));
    return {
      ...tool,
      identifiedByAi: usedAi && tool.source === 'unmatched' && Boolean(tool.vendor),
      risk: computeRisk(p, false),
      depth: baseDepth(p),
      lensCount: required.length,
      controlCount: required.reduce(
        (n, l) => n + controlsAtDepth(l, reviewDepth(l, p)).length,
        0,
      ),
    };
  });

  // Shadow AI first, then by risk: the queue should open on the thing nobody
  // approved that is reading company data right now.
  ranked.sort(
    (a, b) =>
      Number(b.shadowAi) - Number(a.shadowAi) ||
      RISK_ORDER.indexOf(b.risk) - RISK_ORDER.indexOf(a.risk) ||
      a.name.localeCompare(b.name),
  );

  return { tools: ranked, usedAi };
}
