'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, CheckCheck, SlidersHorizontal } from 'lucide-react';
import { computeScoreFromMap } from '@/workbench/engine/scoring';
import { TEAM_LENSES, LENS_BY_ID } from '@/workbench/data/teamLenses';
import { makeEmptyAssessment } from '@/workbench/types';
import type { Profile, TeamAssessment, TeamId } from '@/workbench/types';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { Badge } from '@/components/ui/badge';
import { riskTone, recommendationTone } from '@/components/portal/status';

const sampleProfile: Profile = {
  id: 'demo',
  name: 'ChatGPT Workspace Agent',
  platform: 'ChatGPT Enterprise',
  toolType: 'Workspace agent',
  useCase: '',
  businessOwner: '',
  technicalOwner: '',
  executiveSponsor: '',
  targetUsers: '',
  dataTypes: ['Internal Documents', 'Personal Data (PII)'],
  dataClassification: 'Confidential',
  environment: 'Pilot',
  model: 'GPT-4o',
  agentEnabled: true,
  connectorEnabled: true,
  ragEnabled: true,
  externalVendor: true,
  clientData: false,
  pii: true,
  autonomousActions: true,
  createdAt: '',
  updatedAt: '',
};

export function LiveDemo() {
  const [score, setScore] = useState(3);
  const [controlsComplete, setControlsComplete] = useState(false);
  const [blocker, setBlocker] = useState(false);

  const result = useMemo(() => {
    const map = {} as Record<TeamId, TeamAssessment>;
    for (const lens of TEAM_LENSES) {
      const a = makeEmptyAssessment(lens.id);
      a.score = score;
      if (controlsComplete) {
        lens.requiredControls.forEach((c) => (a.checkedControls[c.id] = true));
        lens.evidenceRequired.forEach((e) => (a.checkedEvidence[e.id] = true));
      }
      map[lens.id] = a;
    }
    if (blocker) map['security-sar'].activeBlockers['sar-b2'] = true; // hardcoded secrets (critical)
    return computeScoreFromMap(sampleProfile, TEAM_LENSES, map);
  }, [score, controlsComplete, blocker]);

  const topTeams = Object.values(result.perTeam)
    .filter((t) => t.required)
    .slice(0, 6);

  return (
    <section id="demo" className="relative overflow-hidden bg-navy-deep py-20 text-white sm:py-28">
      <div className="aurora opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-electric-soft">
            Live · runs in your browser
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Try the readiness engine — no signup
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            This is the real Aegis scoring engine evaluating a sample AI agent. Change the inputs and
            watch readiness, risk, and the go/no-go call update instantly.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]"
        >
          {/* Controls */}
          <div className="gradient-border rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-electric" /> {sampleProfile.name}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {['Agent', 'Connector', 'RAG', 'PII', 'Autonomous', 'Vendor'].map((f) => (
                <span key={f} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Team readiness (all lenses)</span>
                <span className="font-mono text-electric-soft">{score}/5</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="mt-2 w-full accent-[oklch(0.65_0.2_250)]"
              />
            </div>

            <div className="mt-6 space-y-3">
              <Toggle
                on={controlsComplete}
                onClick={() => setControlsComplete((v) => !v)}
                icon={<CheckCheck className="h-4 w-4" />}
                label="Complete all controls & evidence"
                hint="Attach every required control and evidence item"
              />
              <Toggle
                on={blocker}
                danger
                onClick={() => setBlocker((v) => !v)}
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Critical security blocker (hardcoded secrets)"
                hint="A single critical blocker forces readiness to 0"
              />
            </div>

            <Link
              href="/signup"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-electric px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              Do this for your own AI tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Result */}
          <div className="gradient-border rounded-2xl p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <ScoreGauge value={result.readiness} onDark size={150} />
              <div className="flex-1 space-y-3">
                <Row label="Overall risk"><Badge tone={riskTone(result.risk)}>{result.risk}</Badge></Row>
                <Row label="Recommendation">
                  <Badge tone={recommendationTone(result.recommendation)}>{result.recommendation}</Badge>
                </Row>
                <Row label="Evidence complete"><span className="font-semibold">{result.evidenceCompleteness}%</span></Row>
                <Row label="Active blockers">
                  <span className={`font-semibold ${result.blockersCount ? 'text-red-400' : ''}`}>{result.blockersCount}</span>
                </Row>
                <Row label="Teams ready">
                  <span className="font-semibold">{result.teamsReady}/{result.requiredTeams}</span>
                </Row>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
              {topTeams.map((t) => (
                <div key={t.teamId} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-xs text-slate-300">
                    {LENS_BY_ID[t.teamId].icon} {LENS_BY_ID[t.teamId].title}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-electric"
                      animate={{ width: `${t.normalized}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[11px] text-slate-400">{t.normalized}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onClick,
  icon,
  label,
  hint,
  danger,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        on
          ? danger
            ? 'border-red-500/40 bg-red-500/10'
            : 'border-electric/40 bg-electric/10'
          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
      }`}
    >
      <span className={`mt-0.5 ${on ? (danger ? 'text-red-400' : 'text-electric') : 'text-slate-400'}`}>{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block text-xs text-slate-400">{hint}</span>
      </span>
      <span
        className={`mt-1 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
          on ? (danger ? 'bg-red-500' : 'bg-electric') : 'bg-white/15'
        }`}
      >
        <motion.span layout className="block h-4 w-4 rounded-full bg-white" animate={{ x: on ? 16 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} />
      </span>
    </button>
  );
}
