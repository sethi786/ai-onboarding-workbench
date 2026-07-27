'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Boxes, ScanEye } from 'lucide-react';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { Badge } from '@/components/ui/badge';

const tower = [
  { name: 'ChatGPT Enterprise', status: 'Cleared', tone: 'trust' as const },
  { name: 'Microsoft 365 Copilot', status: 'Cleared', tone: 'trust' as const },
  { name: 'Claude Enterprise', status: 'In review', tone: 'electric' as const },
  { name: 'Copilot Studio Agent', status: 'Conditions', tone: 'warning' as const },
  { name: 'Bedrock Case Bot', status: 'Blocked', tone: 'danger' as const },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.5, 0.3, 1] } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep text-white">
      <div className="aurora opacity-60" />
      <div className="bg-grid radial-fade absolute inset-0 opacity-40" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-electric-soft"
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-trust" /> AI Governance · Readiness · Go/No-Go
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-semibold leading-[1.03] tracking-tight sm:text-5xl lg:text-[64px]"
          >
            Get AI tools <span className="text-aurora">cleared</span> for the enterprise.
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Aegis is the readiness platform for onboarding ChatGPT Enterprise, Copilot, Claude, AI
            agents, RAG apps, and connectors — preparing architecture, security, privacy, legal, risk,
            and go/no-go evidence <em>before</em> formal review.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <MagneticButton
              href="/signup"
              className="glow-electric inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-electric px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <a
              href="#demo"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/15 bg-white/5 px-6 text-[15px] font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Try the live demo
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            {['SOC 2 aligned', 'HIPAA-ready', 'NIST AI RMF', 'FedRAMP-aligned'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-trust" /> {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Control tower */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.21, 0.5, 0.3, 1], delay: 0.15 }}
          className="relative"
          style={{ perspective: 1000 }}
        >
          <div className="gradient-border relative overflow-hidden rounded-2xl p-5 backdrop-blur">
            {/* scanning beam */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-electric/15 to-transparent"
              animate={{ y: ['-20%', '520%'] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                <span className="pulse-dot mr-1 inline-block h-1.5 w-1.5 rounded-full bg-trust align-middle" />
                Governance Control Tower
              </span>
              <ScanEye className="h-4 w-4 text-slate-500" />
            </div>

            <motion.div
              className="mt-3 space-y-2"
              variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } } }}
              initial="hidden"
              animate="show"
            >
              {tower.map((row) => (
                <motion.div
                  key={row.name}
                  variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-200">
                    <Boxes className="h-4 w-4 text-electric" /> {row.name}
                  </span>
                  <Badge tone={row.tone} className="font-mono text-[10px] uppercase">
                    {row.status}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center">
              {[
                { v: '20', l: 'Lenses' },
                { v: '78', l: 'Readiness' },
                { v: 'B+', l: 'Risk grade', accent: true },
              ].map((s) => (
                <div key={s.l}>
                  <div className={`text-xl font-semibold ${s.accent ? 'text-trust' : ''}`}>{s.v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
