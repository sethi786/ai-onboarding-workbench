'use client';

import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Grid3x3,
  Settings,
  Search,
  ChevronsUpDown,
} from 'lucide-react';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: ClipboardList, label: 'Evaluations' },
  { icon: Boxes, label: 'Tool Library' },
  { icon: Grid3x3, label: 'Platform Matrix' },
  { icon: Settings, label: 'Settings' },
];

const ROWS = [
  { name: 'ChatGPT Enterprise', env: 'Production', v: 92, risk: 'Low', rec: 'Proceed', tone: 'trust' },
  { name: 'Microsoft 365 Copilot', env: 'Pilot', v: 88, risk: 'Medium', rec: 'Proceed', tone: 'trust' },
  { name: 'Claude Enterprise', env: 'Pilot', v: 74, risk: 'Medium', rec: 'Conditions', tone: 'warn' },
  { name: 'Copilot Studio HR Agent', env: 'UAT', v: 61, risk: 'High', rec: 'Remediate', tone: 'warn' },
  { name: 'Bedrock Case Assistant', env: 'UAT', v: 0, risk: 'Critical', rec: 'Blocked', tone: 'danger' },
] as const;

function toneClasses(t: string) {
  if (t === 'trust') return 'bg-[oklch(0.62_0.15_155_/_0.12)] text-[oklch(0.5_0.13_155)]';
  if (t === 'warn') return 'bg-[oklch(0.75_0.15_80_/_0.15)] text-[oklch(0.5_0.12_75)]';
  return 'bg-[oklch(0.6_0.22_27_/_0.12)] text-[oklch(0.55_0.2_27)]';
}
function barColor(v: number) {
  if (v >= 85) return 'bg-[oklch(0.62_0.15_155)]';
  if (v >= 70) return 'bg-[oklch(0.75_0.15_80)]';
  if (v >= 50) return 'bg-[oklch(0.65_0.18_50)]';
  return 'bg-[oklch(0.6_0.22_27)]';
}

/** A high-fidelity, static render of the real product — the Governance Control Tower. */
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl ring-1 ring-black/5">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <div className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          <Search className="h-3 w-3" /> app.aegis.ai/acme/dashboard
        </div>
      </div>

      {/* App body */}
      <div className="grid grid-cols-[200px_1fr] bg-muted/20 max-sm:grid-cols-1">
        {/* Sidebar */}
        <aside className="flex flex-col gap-1 border-r border-border bg-navy-deep p-3 max-sm:hidden">
          <div className="mb-3 px-2 pt-1">
            <ShieldLogo tone="light" />
          </div>
          {NAV.map((n) => (
            <div
              key={n.label}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium ${
                n.active ? 'bg-electric text-white' : 'text-slate-400'
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Topbar */}
          <div className="flex items-center gap-3 border-b border-border bg-background/80 px-5 py-2.5">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium">
              Acme Financial <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="ml-auto h-6 w-6 rounded-full bg-gradient-to-br from-electric to-[oklch(0.55_0.22_290)]" />
          </div>

          <div className="space-y-5 p-5">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Governance Control Tower</h3>
              <p className="text-xs text-muted-foreground">Acme Financial · AI onboarding portfolio</p>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-[auto_1fr] gap-4">
              <div className="grid place-items-center rounded-lg border border-border bg-card p-4">
                <ScoreGauge value={71} size={120} label="Avg readiness" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'In flight', v: '12' },
                  { l: 'Cleared', v: '5' },
                  { l: 'Blocked', v: '1' },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                    <div className="mt-1 text-2xl font-semibold">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Evaluations</div>
              <div className="divide-y divide-border">
                {ROWS.map((r) => (
                  <div key={r.name} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-44 shrink-0">
                      <div className="truncate text-[13px] font-medium">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.env}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${barColor(r.v)}`} style={{ width: `${r.v}%` }} />
                      </div>
                    </div>
                    <span className="w-8 text-right font-mono text-[11px] text-muted-foreground">{r.v}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClasses(r.tone)}`}>
                      {r.risk}
                    </span>
                    <span className="hidden w-24 text-right text-[11px] font-medium text-muted-foreground sm:block">
                      {r.rec}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
