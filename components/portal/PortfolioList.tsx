'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, ClipboardList } from 'lucide-react';
import {
  filterPortfolio,
  type PortfolioFilter,
  type PortfolioItem,
} from '@/lib/portfolio';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { recommendationTone, riskTone } from './status';
import type { RiskLevel } from '@/workbench/types';

export function PortfolioList({
  items,
  orgSlug,
}: {
  items: PortfolioItem[];
  orgSlug: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PortfolioFilter>('all');
  const [sort, setSort] = useState('updated');
  const [limit, setLimit] = useState(24);
  const filtered = useMemo(
    () => filterPortfolio(items, query, filter, sort),
    [items, query, filter, sort],
  );
  const reset = () => {
    setQuery('');
    setFilter('all');
    setSort('updated');
    setLimit(24);
  };
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search evaluations</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(24);
              }}
              placeholder="Search tools, owners, or environments…"
              className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-11 rounded-lg border bg-background px-3 text-sm text-foreground"
            >
              <option value="updated">Recently updated</option>
              <option value="priority">Needs attention</option>
              <option value="readiness">Lowest readiness</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        <div
          className="mt-4 flex flex-wrap gap-2"
          aria-label="Filter evaluations"
        >
          {(
            [
              ['all', 'All evaluations'],
              ['blocked', 'Has blockers'],
              ['overdue', 'Overdue reviews'],
              ['ready', 'Ready for review'],
              ['unassigned', 'Needs an owner'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setLimit(24);
              }}
              className={`min-h-10 rounded-full border px-3.5 text-xs font-medium ${filter === value ? 'border-electric bg-electric/10 text-electric' : 'border-border hover:bg-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {filtered.length} of {items.length} evaluations
        {filtered.length > limit ? ` · showing ${limit}` : ''}
      </p>
      {!filtered.length ? (
        <div className="rounded-xl border border-dashed bg-card px-5 py-12 text-center">
          <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">
            {items.length
              ? 'No evaluations match these filters'
              : 'Your portfolio starts with one tool'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length
              ? 'Try a different search or clear the filters.'
              : 'Choose a tool from the catalogue to start your first review.'}
          </p>
          {items.length ? (
            <button
              onClick={reset}
              className="mt-5 min-h-11 rounded-full bg-ink px-5 text-sm text-paper"
            >
              Clear filters
            </button>
          ) : (
            <Link
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-paper"
              href={`/portal/${orgSlug}/library`}
            >
              Browse tool library
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.slice(0, limit).map((item) => (
            <article
              key={item.id}
              className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    className="break-words text-base font-semibold hover:text-electric"
                    href={`/portal/${orgSlug}/evaluations/${item.id}`}
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {item.platform || item.category} · {item.environment}
                  </p>
                </div>
                <Badge tone={recommendationTone(item.recommendation)}>
                  {item.recommendation}
                </Badge>
              </div>
              <div className="mt-5 flex justify-between text-xs">
                <span>Readiness</span>
                <span className="font-mono">{item.readiness}/100</span>
              </div>
              <Progress value={item.readiness} className="mt-2" />
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={riskTone(item.risk as RiskLevel)}>
                  {item.risk} risk
                </Badge>
                {item.blockers > 0 && (
                  <Badge tone="danger">{item.blockers} blockers</Badge>
                )}
                {item.overdue > 0 && (
                  <Badge tone="warning">{item.overdue} overdue</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {item.evidence}% evidence supported
                </span>
              </div>
              <p className="mt-4 break-words text-xs text-muted-foreground">
                Owner: {item.owner || 'Not assigned'}
              </p>
              <Link
                href={item.nextHref}
                className="mt-4 flex flex-1 items-center justify-between gap-4 border-t border-border pt-4 text-sm text-electric"
              >
                <span className="min-w-0 break-words">{item.nextAction}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </Link>
            </article>
          ))}
        </div>
      )}
      {filtered.length > limit && (
        <button
          onClick={() => setLimit((n) => n + 24)}
          className="min-h-11 rounded-lg border px-5 text-sm"
        >
          Show 24 more evaluations
        </button>
      )}
    </div>
  );
}
