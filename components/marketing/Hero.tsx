'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductPreview } from './ProductPreview';

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto max-w-5xl px-5 pt-20 text-center sm:px-8 sm:pt-28">
        <motion.div initial="hidden" animate="show" className="flex flex-col items-center">
          <motion.span
            custom={0}
            variants={fade}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[12.5px] font-medium text-muted-foreground shadow-soft"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-electric" />
            SaaS · PaaS · On-prem · AI — governed in one place
          </motion.span>

          <motion.h1 custom={1} variants={fade} className="display-xl mt-7 max-w-4xl">
            Adopt any tool,
            <br className="hidden sm:block" /> already cleared.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fade}
            className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Aegis runs the security, privacy, legal, and risk review that gates every new tool —
            SaaS, PaaS, on-prem, and AI — as one readiness workflow. Replace a months-long,
            multi-department approval gauntlet with a single score. No enterprise review org required.
          </motion.p>

          <motion.div
            custom={3}
            variants={fade}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
          >
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-paper transition-transform hover:scale-[1.03] active:scale-100"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground"
            >
              See it score, live
              <span className="text-electric transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </motion.div>

          <motion.p custom={4} variants={fade} className="mt-6 text-[13px] text-muted-foreground/80">
            No credit card · SOC 2 aligned · NIST AI RMF
          </motion.p>
        </motion.div>
      </div>

      {/* Product shot floating on the warm canvas */}
      <div className="mx-auto mt-16 max-w-5xl px-5 pb-24 sm:mt-20 sm:px-8 sm:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="shadow-float rounded-2xl"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
