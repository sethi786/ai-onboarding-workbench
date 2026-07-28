import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Practical reference guides on security questionnaires, shadow AI, vendor assessment, agent governance, and go/no-go decisions. Free to read, no signup.',
};

export default function ResourcesPage() {
  const [lead, ...rest] = GUIDES;

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Reference guides, free to read"
        subtitle="No email gate, no download form. These are the notes we’d give a colleague facing the same problem — written to be useful whether or not you ever use Aegis."
      />

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        {/* Lead article */}
        <Reveal>
          <Link
            href={`/resources/${lead.slug}`}
            className="group grid gap-8 rounded-2xl border border-border bg-card p-8 transition-colors hover:border-electric/40 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center"
          >
            <div>
              <div className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em]">
                <span className="text-electric">{lead.kind}</span>
                <span className="flex items-center gap-1.5 text-muted-foreground/70">
                  <Clock className="h-3 w-3" /> {lead.minutes} min
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{lead.title}</h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">{lead.dek}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-electric">
                Read the guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                Inside
              </div>
              <ul className="mt-3 space-y-2">
                {lead.sections.map((s) => (
                  <li key={s.h} className="flex items-start gap-2.5 text-[14px] leading-snug">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-electric" />
                    {s.h}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        </Reveal>

        {/* The rest */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rest.map((g, i) => (
            <Reveal key={g.slug} index={i % 2}>
              <Link
                href={`/resources/${g.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-colors hover:border-electric/40 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em]">
                  <span className="text-electric">{g.kind}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground/70">
                    <Clock className="h-3 w-3" /> {g.minutes} min
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{g.title}</h3>
                <p className="mt-2.5 flex-1 text-[14.5px] leading-relaxed text-muted-foreground">{g.dek}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-electric">
                  Read
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
