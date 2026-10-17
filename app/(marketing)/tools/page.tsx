import Link from 'next/link';
import { ToolCatalogue } from '@/components/catalogue/ToolCatalogue';
import { TOOL_TEMPLATES } from '@/data/tool-templates';
export const metadata = {
  title: 'AI tool catalogue',
  description:
    'Explore AI tool assessment starters for assistants, coding agents, creative tools, meetings, and automation.',
};
export default function ToolsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-20 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-electric">
          The AI adoption catalogue
        </p>
        <h1 className="display-xl mt-5 max-w-4xl">
          Know what you’re
          <br />
          bringing into work.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {TOOL_TEMPLATES.length} tool starters. One consistent review process.
          Find your tool, confirm how you’ll use it, and build an
          evidence-backed assessment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-border px-4 py-2">
            Included in Starter
          </span>
          <span className="rounded-full border border-border px-4 py-2">
            20 review lenses
          </span>
          <span className="rounded-full border border-border px-4 py-2">
            No vendor endorsements
          </span>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <ToolCatalogue />
        <div className="mt-12 rounded-2xl bg-ink p-8 text-paper sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your tool isn’t here yet?</h2>
            <p className="mt-2 text-sm text-white/65">
              Use one of six assessment scenarios or start from your own scope.
            </p>
          </div>
          <Link
            href="/assessments"
            className="mt-5 inline-flex rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink sm:mt-0"
          >
            Browse assessment starters
          </Link>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Catalogue updated October 17, 2026. This is a curated starting set,
          not an exhaustive directory. Product names belong to their owners.
          Availability and controls depend on the vendor, edition, region, and
          configuration. Confirm current vendor documentation and your own
          evidence before making a decision.
        </p>
      </section>
    </>
  );
}
