'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, ArrowRight } from 'lucide-react';
import { TOOL_TEMPLATES } from '@/data/tool-templates';
import { InstantiateButton } from '@/components/portal/InstantiateButton';
const categories = [...new Set(TOOL_TEMPLATES.map((t) => t.category))].sort();
export function ToolCatalogue({
  workspace,
  initialQuery = '',
}: {
  workspace?: { id: string; slug: string; editable: boolean };
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('All');
  const tools = useMemo(
    () =>
      TOOL_TEMPLATES.filter(
        (t) =>
          (category === 'All' || t.category === category) &&
          `${t.name} ${t.vendor} ${t.category} ${t.summary}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [query, category],
  );
  return (
    <div>
      <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_220px]">
        <div>
          <label
            htmlFor="tool-search"
            className="mb-2 block text-sm font-medium"
          >
            Find a tool or vendor
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="tool-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try ChatGPT, coding, meetings…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="tool-category"
            className="mb-2 block text-sm font-medium"
          >
            Category
          </label>
          <select
            id="tool-category"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <p aria-live="polite" className="mb-5 text-sm text-muted-foreground">
        {tools.length} of {TOOL_TEMPLATES.length} tools · Review starters, with
        no pre-approved controls
      </p>
      {tools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h2 className="font-semibold">No matching tools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another name, clear the filters, or start a custom assessment.
          </p>
          <button
            type="button"
            className="mt-4 text-electric underline"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <article
              key={tool.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-soft"
            >
              <div className="mb-5 flex items-center justify-between">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl bg-electric/10 text-sm font-semibold text-electric"
                  aria-hidden="true"
                >
                  {tool.vendor.slice(0, 2).toUpperCase()}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  {tool.category}
                </span>
              </div>
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/tools/${tool.id}`}
                  className="hover:text-electric"
                >
                  {tool.name}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {tool.vendor}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {tool.summary}
              </p>
              <div className="mt-6 border-t border-border pt-4">
                {workspace ? (
                  <InstantiateButton
                    orgId={workspace.id}
                    orgSlug={workspace.slug}
                    templateId={tool.id}
                    disabled={!workspace.editable}
                  />
                ) : (
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-medium text-electric"
                    href={`/tools/${tool.id}`}
                  >
                    View assessment starter <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              {tool.sourceUrl && (
                <a
                  href={tool.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline"
                >
                  Vendor website <ArrowUpRight className="h-3 w-3" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
