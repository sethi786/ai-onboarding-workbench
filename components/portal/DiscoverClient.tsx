'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Radar, TriangleAlert, Sparkles } from 'lucide-react';
import { discoverTools, type RankedDiscovery } from '@/lib/actions/discovery';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { riskTone } from '@/components/portal/status';

const SAMPLE = `Microsoft 365 Copilot
Slack
Grammarly
Otter.ai
Salesforce Sales Cloud
Snowflake
Some Internal Tool We Built`;

/**
 * The first screen a workspace should meet.
 *
 * A governance product that opens on a blank form asks the customer to type
 * their tools in from memory — and the customers who need this most are
 * precisely the ones who don't know what's running. Pasting a list they already
 * have turns the unknown into a queue.
 */
export function DiscoverClient({
  orgId,
  orgSlug,
  aiAvailable,
}: {
  orgId: string;
  orgSlug: string;
  aiAvailable: boolean;
}) {
  const [text, setText] = useState('');
  const [tools, setTools] = useState<RankedDiscovery[] | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [pending, startTransition] = useTransition();

  const shadow = tools?.filter((t) => t.shadowAi) ?? [];
  const unmatched = tools?.filter((t) => t.source === 'unmatched' && !t.vendor) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Radar className="h-4 w-4 shrink-0 text-electric" />
          <h2 className="font-semibold">Paste what you already have</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          An SSO application list, an expense or card export, a browser-extension inventory, or just
          the tools you can think of. One per line — messy exports are fine, the columns get
          stripped.
        </p>

        <Textarea
          rows={9}
          className="mt-3 font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await discoverTools(orgId, text);
                if (res.error) {
                  toast.error(res.error);
                  return;
                }
                setTools(res.tools ?? []);
                setUsedAi(Boolean(res.usedAi));
                toast.success(`Found ${res.tools?.length ?? 0} tools`);
              })
            }
          >
            {pending ? 'Scanning…' : 'Scan inventory'}
          </Button>
          <Button variant="ghost" onClick={() => setText(SAMPLE)} disabled={pending}>
            Use a sample
          </Button>
          {!aiAvailable && (
            <span className="text-xs text-muted-foreground">
              Matching runs against the tool library either way. With an API key configured, the
              lines it can’t place get identified too.
            </span>
          )}
        </div>
      </div>

      {tools && tools.length > 0 && (
        <>
          {shadow.length > 0 && (
            <div className="flex gap-3 rounded-lg border border-danger/40 bg-danger/8 p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <div>
                <h3 className="text-sm font-semibold">
                  {shadow.length} AI {shadow.length === 1 ? 'tool has' : 'tools have'} never been
                  reviewed
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {shadow.map((t) => t.name).join(', ')} — reading company data with no assessment
                  behind them. These sit at the top of the queue.
                </p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
              <h2 className="font-semibold">Review queue</h2>
              <span className="text-sm text-muted-foreground">
                {tools.length} tools, highest exposure first
              </span>
              {usedAi && (
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-electric" /> AI identified the unlisted ones
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {['Tool', 'Category', 'Risk', 'Review', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tools.map((t) => (
                    <tr key={t.name} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{t.name}</span>
                          {t.shadowAi && <Badge tone="danger">Shadow AI</Badge>}
                          {t.templateId && <Badge tone="electric">Prefilled</Badge>}
                        </div>
                        {t.vendor && (
                          <div className="text-xs text-muted-foreground">{t.vendor}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                      <td className="px-4 py-3">
                        <Badge tone={riskTone(t.risk as never)}>{t.risk}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {t.lensCount} lenses · {t.controlCount} controls
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={
                            t.templateId
                              ? `/portal/${orgSlug}/library`
                              : `/portal/${orgSlug}/evaluations/new`
                          }
                          className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                        >
                          {t.templateId ? 'Start prefilled' : 'Start review'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {unmatched.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {unmatched.length} {unmatched.length === 1 ? 'line was' : 'lines were'} kept but not
              identified. They&rsquo;re still listed rather than dropped — something running that
              nothing recognises is worth a look, not a silent delete.
            </p>
          )}
        </>
      )}

      {tools && tools.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing recognisable in that paste. Try one tool per line.
        </p>
      )}
    </div>
  );
}
