import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { LensIcon } from '@/components/icons/LensIcon';
import { Badge } from '@/components/ui/badge';
import { TOOL_PAGES, TOOL_PAGE_BY_SLUG } from '@/lib/tool-pages';
import type { TeamId } from '@/workbench/types';

export function generateStaticParams() {
  return TOOL_PAGES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = TOOL_PAGE_BY_SLUG[slug];
  if (!t) return { title: 'Tool review' };
  return {
    title: `${t.name} review: which approvals it needs`,
    description: `What a ${t.name} adoption review covers — the ${t.lenses.length} reviews that apply, ${t.totalControls} controls, and the risks that decide the outcome.`,
  };
}

const depthTone = (d: string) => (d === 'Deep' ? 'warning' : d === 'Standard' ? 'trust' : 'neutral');

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TOOL_PAGE_BY_SLUG[slug];
  if (!t) notFound();

  const others = TOOL_PAGES.filter((x) => x.slug !== t.slug).slice(0, 4);
  const withNotes = t.lenses.filter((l) => l.note);

  return (
    <>
      <PageHero
        eyebrow={`${t.vendor} · ${t.category}`}
        title={`Adopting ${t.name}? Here's the review it has to clear.`}
        subtitle={t.summary}
      />

      {/* The numbers, up front — this is what someone came to find out. */}
      <section className="border-y border-border bg-paper">
        <div className="mx-auto grid max-w-5xl gap-px bg-border px-0 sm:grid-cols-4">
          {[
            { n: String(t.lenses.length), l: 'reviews apply' },
            { n: String(t.totalControls), l: 'controls to answer' },
            { n: t.depth, l: 'review depth' },
            { n: t.risk, l: 'typical risk grade' },
          ].map((s) => (
            <div key={s.l} className="bg-paper px-6 py-8 text-center">
              <div className="text-3xl font-semibold tracking-tight sm:text-4xl">{s.n}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What reviewers will ask about */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <Reveal>
          <h2 className="display-lg">What makes this one a review</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            These are the facts about {t.name} that summon each review team. Change any of them for
            your own rollout and the required set changes with it.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {t.characteristics.map((c) => (
            <div key={c} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
              <span className="text-[15px]">{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* The actual reviews */}
      <section className="bg-sage">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <Reveal>
            <h2 className="display-lg">The {t.lenses.length} reviews that apply</h2>
            <p className="mt-4 max-w-2xl text-lg text-foreground/70">
              Depth is set by what&rsquo;s at stake, so a sandbox trial asks far less than a
              production rollout. These figures assume a typical {t.profile.environment.toLowerCase()}{' '}
              deployment on {t.profile.dataClassification.toLowerCase()} data.
            </p>
          </Reveal>

          <div className="mt-12 overflow-hidden rounded-2xl border border-foreground/10 bg-card">
            {t.lenses.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-border p-5 last:border-0"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-electric/10 text-electric">
                  <LensIcon id={l.id as TeamId} className="h-4 w-4" />
                </span>
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{l.title}</h3>
                    <Badge tone={depthTone(l.depth)}>{l.depth}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.purpose}</p>
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
                  <div>{l.controlCount} controls</div>
                  <div>{l.evidenceCount} documents</div>
                </div>
              </div>
            ))}
          </div>

          {t.skipped.length > 0 && (
            <div className="mt-6 flex flex-wrap items-start gap-3 rounded-xl border border-dashed border-foreground/20 p-5">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-foreground/40" />
              <p className="flex-1 text-sm text-foreground/70">
                <strong className="text-foreground">
                  {t.skipped.length} reviews don&rsquo;t apply
                </strong>{' '}
                to a typical {t.name} adoption: {t.skipped.join(', ')}. Being told which reviews you
                can skip — and why — is half of what a governance process is for.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* The specific gotchas */}
      {withNotes.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
          <Reveal>
            <h2 className="display-lg">Where {t.name} reviews usually catch</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The specific findings that decide these reviews, rather than generic advice.
            </p>
          </Reveal>
          <div className="mt-10 space-y-5">
            {withNotes.map((l) => (
              <div key={l.id} className="border-l-2 border-electric pl-5">
                <h3 className="font-semibold">{l.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{l.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Convert */}
      <section className="border-t border-border bg-sand">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
          <h2 className="display-lg text-balance">
            Start this review with the answers already filled in.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/70">
            {t.name} is in the tool library. Add it to a workspace and you begin with these{' '}
            {t.lenses.length} reviews scoped, the capability flags set, and starter notes on the
            lenses that matter — free, all the way to a branded review document.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-[15px] font-medium text-paper transition-transform hover:scale-[1.02]"
          >
            Review {t.name} free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Other tools
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/tools/${o.slug}`}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-electric/50"
            >
              <h3 className="font-semibold">{o.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {o.lenses.length} reviews · {o.totalControls} controls
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
