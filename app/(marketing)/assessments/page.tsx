import Link from 'next/link';
import { ASSESSMENT_TEMPLATES } from '@/data/assessment-templates';
import { PageHero } from '@/components/marketing/PageHero';
export const metadata = { title: 'Assessment starters' };
export default function AssessmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Assessments"
        title="Start with the way you use AI."
        subtitle="Six practical starting scopes. Each uses the same 20-lens readiness rubric and starts with no controls or evidence marked complete."
      />
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {ASSESSMENT_TEMPLATES.map((t, i) => (
          <article
            key={t.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-7"
          >
            <span className="font-mono text-sm text-electric">0{i + 1}</span>
            <h2 className="mt-4 text-xl font-semibold">{t.name}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {t.summary}
            </p>
            <Link
              href={`/signup?next=${encodeURIComponent(`/portal/start?template=${t.id}`)}`}
              className="mt-6 text-sm font-medium text-electric"
            >
              Start this assessment →
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
