import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { Badge } from '@/components/ui/badge';
import { TOOL_PAGES } from '@/lib/tool-pages';

export const metadata: Metadata = {
  title: 'Tool reviews',
  description:
    'What an adoption review covers for Microsoft 365 Copilot, ChatGPT Enterprise, Salesforce, Snowflake, Slack, Workday and more — the reviews that apply, the controls, and the risks that decide it.',
};

const depthTone = (d: string) => (d === 'Deep' ? 'warning' : d === 'Standard' ? 'trust' : 'neutral');

export default function ToolsIndex() {
  const byCategory = TOOL_PAGES.reduce<Record<string, typeof TOOL_PAGES>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <>
      <PageHero
        eyebrow="Tool reviews"
        title="What the review actually covers, tool by tool"
        subtitle="Every one of these is in the library, so the answers below are the same ones the product uses — not a brochure."
      />

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        {Object.entries(byCategory).map(([category, tools]) => (
          <div key={category} className="mt-16 first:mt-10">
            <Reveal>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {category}
              </h2>
            </Reveal>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="flex flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-electric/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{t.vendor}</p>
                    </div>
                    <Badge tone={depthTone(t.depth)}>{t.depth}</Badge>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t.summary}
                  </p>
                  <p className="mt-4 border-t border-border pt-3 font-mono text-xs text-muted-foreground">
                    {t.lenses.length} reviews · {t.totalControls} controls · {t.risk} risk
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
