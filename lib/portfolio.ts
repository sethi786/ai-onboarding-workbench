import type { Recommendation } from '@/workbench/types';

export interface PortfolioItem {
  id: string;
  name: string;
  platform: string;
  category: string;
  environment: string;
  owner: string;
  updatedAt: string;
  readiness: number;
  risk: string;
  recommendation: Recommendation;
  blockers: number;
  evidence: number;
  nextAction: string;
  nextHref: string;
  overdue: number;
}
export type PortfolioFilter =
  | 'all'
  | 'blocked'
  | 'overdue'
  | 'ready'
  | 'unassigned';

export function filterPortfolio(
  items: PortfolioItem[],
  query: string,
  filter: PortfolioFilter,
  sort: string,
) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter((item) => {
    const text = [
      item.name,
      item.platform,
      item.owner,
      item.category,
      item.environment,
    ]
      .join(' ')
      .toLocaleLowerCase();
    return (
      terms.every((term) => text.includes(term)) &&
      (filter === 'all' ||
        (filter === 'blocked' && item.blockers > 0) ||
        (filter === 'overdue' && item.overdue > 0) ||
        (filter === 'ready' && item.recommendation === 'Proceed') ||
        (filter === 'unassigned' && !item.owner.trim()))
    );
  });
  return matches.sort((a, b) =>
    sort === 'name'
      ? a.name.localeCompare(b.name)
      : sort === 'readiness'
        ? a.readiness - b.readiness || a.name.localeCompare(b.name)
        : sort === 'priority'
          ? b.blockers - a.blockers ||
            b.overdue - a.overdue ||
            a.readiness - b.readiness
          : b.updatedAt.localeCompare(a.updatedAt),
  );
}
