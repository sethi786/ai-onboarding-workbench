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
  if (t === 'trust') return 'bg-[oklch(0.56_0.11_158_/_0.14)] text-[oklch(0.42_0.1_158)]';
  if (t === 'warn') return 'bg-[oklch(0.72_0.13_74_/_0.18)] text-[oklch(0.46_0.11_66)]';
  return 'bg-[oklch(0.58_0.2_27_/_0.12)] text-[oklch(0.5_0.19_27)]';
}
function barColor(v: number) {
  if (v >= 85) return 'bg-[oklch(0.56_0.11_158)]';
  if (v >= 70) return 'bg-[oklch(0.72_0.13_74)]';
  if (v >= 50) return 'bg-[oklch(0.65_0.16_50)]';
  return 'bg-[oklch(0.58_0.2_27)]';
}

/** A high-fidelity, static render of the real product — the Governance Control Tower. */
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-card">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <div className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Search className="h-3 w-3" /> app.aegis.ai/acme/dashboard
        </div>
      </div>

      {/* App body */}
      <div className="grid grid-cols-[210px_1fr] bg-surface max-sm:grid-cols-1">
        {/* Sidebar */}
        <aside className="flex flex-col gap-1 border-r border-border bg-ink p-3 max-sm:hidden">
          <div className="mb-3 px-2 pt-1">
            <ShieldLogo tone="light" />
          </div>
          {NAV.map((n) => (
            <div
              key={n.label}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium ${
                n.active ? 'bg-electric text-white' : 'text-white/55'
              }`}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Topbar */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-2.5">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium">
              Acme Financial <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-electric text-[10px] font-semibold text-white">
              AF
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Governance Control Tower</h3>
              <p className="text-xs text-muted-foreground">Acme Financial · AI onboarding portfolio</p>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-[auto_1fr] gap-4 max-sm:grid-cols-1">
              <div className="grid place-items-center rounded-xl border border-border bg-card p-4">
                <ScoreGauge value={71} size={120} label="Avg readiness" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'In flight', v: '12' },
                  { l: 'Cleared', v: '5' },
                  { l: 'Blocked', v: '1' },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                    <div className="mt-1 text-2xl font-semibold">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Evaluations</div>
              <div className="divide-y divide-border">
                {ROWS.map((r) => (
                  <div key={r.name} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-44 shrink-0">
                      <div className="truncate text-[13px] font-medium">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.env}</div>
                    </div>
                    <div className="flex-1 max-sm:hidden">
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
