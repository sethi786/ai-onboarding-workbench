'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles, UserCheck } from 'lucide-react';
import { updateAiSettings, updateSeparationOfDuties } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';

/**
 * The first question a CISO asks about an AI feature: can we turn it off.
 *
 * The answer needs to be visibly yes, and enforced somewhere they can verify —
 * which is why the copy names the server-side gate rather than promising the
 * button hides things.
 */
export function AiSettingsForm({
  orgId,
  orgSlug,
  enabled,
  configured,
  canManage,
  separationOfDuties,
  memberCount,
}: {
  orgId: string;
  orgSlug: string;
  enabled: boolean;
  configured: boolean;
  canManage: boolean;
  separationOfDuties: boolean;
  memberCount: number;
}) {
  const [on, setOn] = useState(enabled);
  const [sod, setSod] = useState(separationOfDuties);
  const [pending, startTransition] = useTransition();
  const [sodPending, startSod] = useTransition();

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">AI assistance</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            When on, this workspace may send evaluation content to Anthropic to draft intake
            records, review sections, summaries, and questionnaire answers. Every call is recorded
            in the audit trail with the model used and a SHA-256 of exactly what was sent.
          </p>
        </div>
        <Button
          variant={on ? 'outline' : 'primary'}
          disabled={!canManage || pending}
          onClick={() =>
            startTransition(async () => {
              const next = !on;
              const res = await updateAiSettings(orgId, orgSlug, next);
              if (res?.error) {
                toast.error(res.error);
                return;
              }
              setOn(next);
              toast.success(next ? 'AI assistance enabled' : 'AI assistance disabled');
            })
          }
        >
          {pending ? 'Saving…' : on ? 'Turn off' : 'Turn on'}
        </Button>
      </div>

      <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {on
          ? 'Currently on. Turning it off is enforced server-side — every AI action is refused and the refusal is logged, not merely hidden from the interface.'
          : 'Currently off. Every AI action is refused server-side. The rest of the product is unaffected: scoring, scope, diagrams, documents, and the framework mapping all work without it.'}
        {!configured && ' No API key is configured on this deployment either, so nothing would run regardless.'}
      </p>

      {!canManage && (
        <p className="mt-2 text-xs text-muted-foreground">
          Only owners and admins can change this.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-start gap-3 border-t border-border pt-6">
        <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Separation of duties</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            When on, the reviewer who last edited an assessment cannot record its decision — someone
            else has to sign it off. Enforced by a database trigger, so it holds even for a caller
            going straight at the API.
          </p>
        </div>
        <Button
          variant={sod ? 'outline' : 'primary'}
          disabled={!canManage || sodPending || (memberCount < 2 && !sod)}
          onClick={() =>
            startSod(async () => {
              const next = !sod;
              const res = await updateSeparationOfDuties(orgId, orgSlug, next);
              if (res?.error) {
                toast.error(res.error);
                return;
              }
              setSod(next);
              toast.success(next ? 'Separation of duties required' : 'Separation of duties relaxed');
            })
          }
        >
          {sodPending ? 'Saving…' : sod ? 'Turn off' : 'Require it'}
        </Button>

        {memberCount < 2 && !sod && (
          <p className="w-full text-xs text-muted-foreground">
            This workspace has one member, so nobody could sign off anybody else&rsquo;s work.
            Invite a second reviewer first.
          </p>
        )}
      </div>
    </div>
  );
}
