import Link from 'next/link';
import {
  ArrowUpRight,
  LayoutDashboard,
  ClipboardList,
  Boxes,
  History,
  ShieldCheck,
} from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

const rows = [
  {
    name: 'Employee assistant',
    scope: 'Internal knowledge · Pilot',
    state: 'Review evidence',
    progress: 72,
    detail: 'Security review needs a current access-control reference.',
    tone: 'warning',
  },
  {
    name: 'Customer support agent',
    scope: 'Customer data · Sandbox',
    state: 'Resolve blocker',
    progress: 48,
    detail: 'Confirm human review before external actions.',
    tone: 'danger',
  },
  {
    name: 'Developer copilot',
    scope: 'Source code · Pilot',
    state: 'Confirm scope',
    progress: 31,
    detail: 'Review the repository permissions and data boundary.',
    tone: 'electric',
  },
];

/** Explicitly illustrative UI. The adjacent demo runs the actual scoring engine. */
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-3 text-xs">
        <span className="inline-flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 text-electric" />
          Aegis workspace
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          Illustrative sample · fictional data
        </span>
      </div>
      <div className="grid md:grid-cols-[176px_minmax(0,1fr)]">
        <div
          aria-hidden
          className="hidden bg-ink px-3 py-6 text-white/60 md:block"
        >
          <div className="mb-8 px-2">
            <ShieldLogo tone="light" />
          </div>
          {[
            { icon: LayoutDashboard, name: 'Overview' },
            { icon: ClipboardList, name: 'Evaluations' },
            { icon: Boxes, name: 'Tool library' },
            { icon: History, name: 'Activity' },
          ].map((item, index) => (
            <div
              key={item.name}
              className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-3 text-xs ${index === 0 ? 'bg-white/10 text-white' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </div>
          ))}
        </div>
        <div className="min-w-0 bg-surface p-4 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Example workspace
              </p>
              <h2 className="text-lg font-semibold sm:text-xl">
                Your governance overview
              </h2>
            </div>
            <span className="rounded-full border bg-card px-3 py-1.5 text-xs">
              3 evaluations
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Average readiness', value: '50/100' },
              { label: 'Needs attention', value: '3' },
              { label: 'Has blockers', value: '1' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border bg-card p-3 sm:p-4"
              >
                <p className="text-[10px] text-muted-foreground sm:text-xs">
                  {stat.label}
                </p>
                <p className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 overflow-hidden rounded-lg border bg-card">
            <p className="border-b px-4 py-3 text-xs font-semibold">
              Your next actions
            </p>
            <ul className="divide-y">
              {rows.map((row) => (
                <li
                  key={row.name}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_1.2fr] sm:gap-5"
                >
                  <div>
                    <p className="text-xs font-semibold sm:text-sm">
                      {row.name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                      {row.scope}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-electric/70"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px]">
                        {row.progress}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${row.tone === 'danger' ? 'text-danger' : 'text-electric'}`}
                    >
                      {row.state}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {row.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/demo"
            className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-electric"
          >
            Try the live readiness engine
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
