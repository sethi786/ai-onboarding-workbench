'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { ProductPreview } from './ProductPreview';

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.21, 0.5, 0.3, 1] },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep text-white">
      {/* restrained backdrop: one soft glow + faint grid */}
      <div className="bg-grid radial-fade absolute inset-0 opacity-[0.18]" />
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-electric/20 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-4 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.div initial="hidden" animate="show" className="flex flex-col items-center">
          <motion.a
            custom={0}
            variants={fade}
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-trust" /> 20-lens enterprise readiness, in one place
            <ArrowRight className="h-3 w-3" />
          </motion.a>

          <motion.h1
            custom={1}
            variants={fade}
            className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]"
          >
            Clear AI for the enterprise
            <br className="hidden sm:block" /> with confidence.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fade}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300"
          >
            Aegis is the readiness platform for onboarding ChatGPT, Copilot, Claude, AI agents, RAG
            apps, and connectors — with architecture, security, privacy, legal, risk, and go/no-go
            evidence prepared before formal review.
          </motion.p>

          <motion.div custom={3} variants={fade} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <MagneticButton
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-electric px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <a
              href="#demo"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-7 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Try the live demo
            </a>
          </motion.div>

          <motion.p custom={4} variants={fade} className="mt-6 text-xs text-slate-500">
            SOC 2 aligned · HIPAA-ready · NIST AI RMF · No credit card required
          </motion.p>
        </motion.div>
      </div>

      {/* Big product shot on the dark hero */}
      <div className="relative mx-auto mt-16 max-w-5xl px-4 pb-24 sm:px-6">
        <div className="pointer-events-none absolute inset-x-8 top-8 bottom-10 rounded-full bg-electric/10 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.5, 0.3, 1] }}
          className="relative"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
