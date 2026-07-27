import Link from 'next/link';
import { ShieldCheck, Boxes, FileCheck2 } from 'lucide-react';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

const POINTS = [
  { icon: ShieldCheck, t: '20 enterprise review lenses', d: 'Security, Privacy, Legal, Risk, Data Gov, Agent & Connector governance.' },
  { icon: Boxes, t: 'Prefilled AI-tool library', d: 'Start from ChatGPT, Copilot, Claude, Bedrock and more — not a blank page.' },
  { icon: FileCheck2, t: 'Evidence, ready for review', d: 'Generate draft SAR, PIA, and go/no-go packs from your assessment.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Value panel */}
      <div className="relative hidden overflow-hidden bg-navy-deep p-12 text-white lg:flex lg:flex-col">
        <div className="bg-grid radial-fade absolute inset-0 opacity-[0.15]" />
        <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-electric/20 blur-[120px]" />
        <div className="relative flex h-full flex-col">
          <Link href="/">
            <ShieldLogo tone="light" />
          </Link>
          <div className="my-auto max-w-md">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Clear AI for the enterprise with confidence.
            </h2>
            <div className="mt-10 space-y-6">
              {POINTS.map((p) => (
                <div key={p.t} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <p.icon className="h-4 w-4 text-electric" />
                  </span>
                  <div>
                    <div className="font-medium">{p.t}</div>
                    <div className="text-sm text-slate-400">{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            SOC 2 · ISO 27001 · HIPAA · NIST AI RMF-aligned
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="relative flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center lg:hidden">
            <ShieldLogo />
          </Link>
          {children}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Aegis is a self-evaluation & readiness aid — it doesn’t replace formal approval.
          </p>
        </div>
      </div>
    </div>
  );
}
