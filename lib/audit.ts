import 'server-only';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import type { AuditEvent } from './audit-format';

/**
 * The record of who did what.
 *
 * Two rules shape everything here. Recording must never break the thing being
 * recorded — an audit write that fails should cost you the evidence, not the
 * decision somebody was making. And the trail is append-only at the database
 * level, because a log the actors can edit is not evidence, it is a document.
 */

export type AuditAction =
  | 'evaluation.created'
  | 'evaluation.updated'
  | 'evaluation.deleted'
  | 'evaluation.instantiated'
  | 'assessment.updated'
  | 'assessment.decided'
  | 'assessment.recalled'
  | 'workflow.updated'
  | 'report.saved'
  | 'member.invited'
  | 'member.joined'
  | 'branding.updated'
  | 'settings.updated'
  | 'ai.invoked'
  | 'ai.refused';

export interface AuditEntry {
  orgId: string;
  action: AuditAction;
  /** One sentence a non-engineer can read in a compliance review. */
  summary: string;
  subjectType?: 'evaluation' | 'assessment' | 'organization' | 'member' | 'report';
  subjectId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write one event. Best-effort by design.
 *
 * Callers do not await a result they can act on, because there is no sensible
 * recovery: refusing a user's approval because the audit insert timed out
 * would be worse than the missing row.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('audit_events').insert({
      org_id: entry.orgId,
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action: entry.action,
      subject_type: entry.subjectType ?? null,
      subject_id: entry.subjectId ?? null,
      summary: entry.summary,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // Swallowed on purpose — see the note above.
  }
}

/**
 * Fingerprint of what was sent to a model.
 *
 * Records proof without making a second copy of the customer's governance data
 * in a table with different retention. A CISO asking "can you show me what you
 * sent" gets a hash they can recompute against their own copy, which is a
 * stronger answer than a text field somebody could have edited.
 */
export function fingerprint(input: string): { sha256: string; chars: number } {
  return {
    sha256: createHash('sha256').update(input, 'utf8').digest('hex'),
    chars: input.length,
  };
}


export async function listAuditEvents(
  orgId: string,
  opts: { limit?: number; subjectId?: string } = {},
): Promise<AuditEvent[]> {
  const supabase = await createClient();
  let q = supabase
    .from('audit_events')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.subjectId) q = q.eq('subject_id', opts.subjectId);

  const { data } = await q;
  return (data ?? []) as AuditEvent[];
}

// Re-exported so server callers have one import for the whole trail.
export type { AuditEvent } from './audit-format';
export { auditToCsv } from './audit-format';
