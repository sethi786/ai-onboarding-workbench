import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { GUIDES, GUIDE_BY_SLUG } from '@/lib/guides';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDE_BY_SLUG[slug];
  if (!g) return { title: 'Resource' };
  return { title: g.title, description: g.dek };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDE_BY_SLUG[slug];
  if (!g) notFound();

  const more = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 2);

  return (
    <article>
      {/* Header */}
      <header className="border-b border-border bg-paper">
        <div className="mx-auto max-w-3xl px-5 pb-14 pt-16 sm:px-8 sm:pt-20">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Resources
          </Link>
          <div className="mt-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em]">
            <span className="text-electric">{g.kind}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground/70">
              <Clock className="h-3 w-3" /> {g.minutes} min read
            </span>
          </div>
          <h1 className="display-lg mt-4">
            {g.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">{g.dek}</p>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div className="space-y-5 text-[17px] leading-[1.75] text-foreground/85">
          {g.intro.map((p, i) => (
            <p key={i} className={i === 0 ? 'text-[19px] leading-[1.7] text-foreground' : undefined}>
              {p}
            </p>
          ))}
        </div>

        {g.sections.map((s) => (
          <section key={s.h} className="mt-14">
            <h2 className="display-md">{s.h}</h2>

            {s.body && (
              <div className="mt-5 space-y-4 text-[17px] leading-[1.75] text-foreground/85">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {s.list && (
              <ul className="mt-6 space-y-3">
                {s.list.map((li) => (
                  <li key={li} className="flex items-start gap-3.5">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                    <span className="text-[16.5px] leading-[1.7] text-foreground/85">{li}</span>
                  </li>
                ))}
              </ul>
            )}

            {s.pairs && (
              <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {s.pairs.map((p) => (
                  <div key={p.k} className="grid gap-1 bg-card p-5 sm:grid-cols-[1fr_1.2fr] sm:gap-6">
                    <div className="text-[15px] font-medium">{p.k}</div>
                    <div className="text-[15px] leading-relaxed text-muted-foreground">{p.v}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Takeaway */}
        <div className="mt-16 rounded-2xl border-l-2 border-electric bg-sand p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-electric">
            The short version
          </div>
          <p className="mt-3 text-[17px] font-medium leading-relaxed">{g.takeaway}</p>
        </div>

        {/* Soft CTA */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-7">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Aegis runs this process as a guided workflow — the lenses, the controls, the evidence, and
            the decision record — for SaaS, PaaS, on-prem, and AI tools alike.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-transform hover:scale-[1.02]"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/platform"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              See the platform
            </Link>
          </div>
        </div>
      </div>

      {/* More */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            Keep reading
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {more.map((m) => (
              <Link
                key={m.slug}
                href={`/resources/${m.slug}`}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-electric/40"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-electric">
                  {m.kind}
                </div>
                <div className="mt-2 text-[15px] font-medium leading-snug">{m.title}</div>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-electric">
                  Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
