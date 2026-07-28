import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { recordAudit, fingerprint } from '@/lib/audit';
import { AI_MODEL, isAiConfigured } from './client';

/**
 * The controls a CISO asks about before letting a governance tool near their
 * data, in the order they ask them: can we switch it off, what exactly gets
 * sent, and can somebody run up our bill.
 */

export interface AiPolicy {
  /** Deployment has credentials at all. */
  configured: boolean;
  /** Workspace has not switched the assistant off. */
  enabled: boolean;
  allowed: boolean;
  /** Why it is unavailable, in words a user can act on. */
  reason?: string;
}

export async function aiPolicyFor(orgId: string): Promise<AiPolicy> {
  const configured = isAiConfigured();

  const supabase = await createClient();
  // RLS-scoped: a workspace you are not in returns nothing, which fails closed.
  const { data } = await supabase
    .from('organizations')
    .select('ai_enabled')
    .eq('id', orgId)
    .maybeSingle();

  if (!data) return { configured, enabled: false, allowed: false, reason: 'Workspace not found.' };

  const enabled = data.ai_enabled !== false;
  if (!configured) {
    return {
      configured,
      enabled,
      allowed: false,
      reason: 'The AI assistant is not configured for this deployment.',
    };
  }
  if (!enabled) {
    return {
      configured,
      enabled,
      allowed: false,
      reason:
        'AI assistance is switched off for this workspace. An owner or admin can turn it back on in Settings.',
    };
  }
  return { configured, enabled, allowed: true };
}

/**
 * Cheap in-process rate limit.
 *
 * Not distributed and does not need to be: this exists so one person holding
 * down a button cannot run up the deployment's model bill, not to defend
 * against a determined attacker who has already authenticated into a
 * workspace. A serverless deployment gets per-instance limits, which is a
 * weaker guarantee than it looks — noted here rather than glossed over, and
 * the ceiling is low enough that the weak version still bounds the damage.
 */
const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 12;
const buckets = new Map<string, number[]>();

export function withinRateLimit(orgId: string): boolean {
  const now = Date.now();
  const recent = (buckets.get(orgId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_CALLS_PER_WINDOW) {
    buckets.set(orgId, recent);
    return false;
  }
  recent.push(now);
  buckets.set(orgId, recent);
  return true;
}

export interface AiGuardResult {
  ok: boolean;
  error?: string;
}

/**
 * One gate in front of every AI action: policy, then rate limit, then a record
 * that the call happened.
 *
 * The record carries a hash of the exact input rather than the input itself.
 * Copying customer governance data into a second table with different
 * retention would create the problem this product exists to prevent, and a
 * hash the customer can recompute is a stronger answer than a text field
 * somebody could have edited afterwards.
 */
export async function guardAiCall(
  orgId: string,
  kind: string,
  input: string,
  subject?: { type: 'evaluation' | 'organization'; id: string },
): Promise<AiGuardResult> {
  const policy = await aiPolicyFor(orgId);
  if (!policy.allowed) {
    if (policy.configured && !policy.enabled) {
      await recordAudit({
        orgId,
        action: 'ai.refused',
        summary: `AI assistance refused for ${kind}: switched off for this workspace.`,
        subjectType: subject?.type,
        subjectId: subject?.id,
        metadata: { kind },
      });
    }
    return { ok: false, error: policy.reason };
  }

  if (!withinRateLimit(orgId)) {
    return {
      ok: false,
      error: 'Too many AI requests in the last minute. Give it a moment and try again.',
    };
  }

  const fp = fingerprint(input);
  await recordAudit({
    orgId,
    action: 'ai.invoked',
    summary: `AI assistance used for ${kind}.`,
    subjectType: subject?.type,
    subjectId: subject?.id,
    metadata: {
      kind,
      model: AI_MODEL,
      provider: 'Anthropic',
      inputSha256: fp.sha256,
      inputChars: fp.chars,
    },
  });

  return { ok: true };
}
