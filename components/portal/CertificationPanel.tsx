'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { CalendarClock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { certifyEvaluation } from '@/lib/actions/certification';
import { certificationSummary, CADENCE_MONTHS } from '@/workbench/engine/recertification';
import type { CertificationStatus } from '@/workbench/engine/recertification';
import type { RiskLevel } from '@/workbench/types';

/**
 * When this clearance runs out, and how to renew it.
 *
 * Shown on every evaluation rather than only on expired ones: "cleared until
 * March" is information a reviewer wants before they are chased for it, and a
 * tool that has never been certified should say so plainly rather than look
 * indefinitely approved.
 */
export function CertificationPanel({
  evalId,
  orgId,
  orgSlug,
  risk,
  status,
  validUntil,
  canEdit,
}: {
  evalId: string;
  orgId: string;
  orgSlug: string;
  risk: RiskLevel;
  status: CertificationStatus;
  validUntil: string | null;
  canEdit: boolean;
}) {
  const [pending, start] = useTransition();
  const months = CADENCE_MONTHS[risk];

  const tone =
    status.state === 'expired'
      ? 'border-danger/30 bg-danger/10 text-danger'
      : status.state === 'due-soon'
        ? 'border-warning/40 bg-warning/10 text-[oklch(0.45_0.09_75)]'
        : 'border-border bg-muted/40';
  const Icon =
    status.state === 'expired' || status.state === 'due-soon' ? AlertTriangle : CalendarClock;

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-sm ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 leading-relaxed">{certificationSummary(status, validUntil)}</span>
      {canEdit && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await certifyEvaluation(evalId, orgId, orgSlug, risk);
              if (r.error) toast.error(r.error);
              else toast.success(`Cleared until ${r.validUntil}.`);
            })
          }
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-current/30 bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
          // The cadence is not the certifier's to choose — see the action.
          title={`${risk} risk clears for ${months} months`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {status.state === 'not-certified' ? 'Record clearance' : 'Recertify'}
          <span className="text-muted-foreground">· {months}mo</span>
        </button>
      )}
    </div>
  );
}
