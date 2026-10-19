import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOOL_TEMPLATE_BY_ID, TOOL_TEMPLATES } from '@/data/tool-templates';
export function generateStaticParams() {
  return TOOL_TEMPLATES.map((t) => ({ slug: t.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = TOOL_TEMPLATE_BY_ID[slug];
  return {
    title: tool ? `${tool.name} governance assessment` : 'Tool not found',
  };
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = TOOL_TEMPLATE_BY_ID[slug];
  if (!tool || tool.category === 'Assessment') notFound();
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <Link href="/tools" className="text-sm text-electric">
        ← All tools
      </Link>
      <p className="mt-12 text-xs uppercase tracking-widest text-muted-foreground">
        {tool.vendor} / {tool.category}
      </p>
      <h1 className="display-lg mt-4">Review {tool.name}</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        {tool.summary}
      </p>
      <div className="mt-10 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-border p-7">
          <h2 className="text-xl font-semibold">
            Your assessment starts with these questions
          </h2>
          <ul className="mt-5 space-y-5">
            {Object.entries(tool.suggested).map(([id, value]) => (
              <li
                key={id}
                className="border-b border-border pb-4 text-sm leading-relaxed"
              >
                {value.notes}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">
            All scores, evidence, and decisions start unreviewed. Suggested
            settings describe a review scenario and must be confirmed against
            your actual deployment.
          </p>
        </section>
        <aside className="h-fit rounded-2xl bg-ink p-7 text-paper">
          <h2 className="text-xl font-semibold">Make it your review</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-white/75">
            <li>Create your workspace.</li>
            <li>Add this tool and confirm its scope.</li>
            <li>Work through controls and attach evidence.</li>
            <li>Record findings for your formal reviewers.</li>
          </ol>
          <Link
            href={`/signup?next=${encodeURIComponent(`/portal/start?template=${tool.id}`)}`}
            className="mt-7 flex justify-center rounded-full bg-paper px-5 py-3 text-sm font-medium text-ink"
          >
            Start this assessment free
          </Link>
          <p className="mt-3 text-center text-xs text-white/65">
            3 evaluations · No credit card
          </p>
        </aside>
      </div>
      {tool.sourceUrl && (
        <p className="mt-8 text-sm">
          <a
            href={tool.sourceUrl}
            className="text-electric underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check the vendor’s current documentation ↗
          </a>
        </p>
      )}
    </div>
  );
}
