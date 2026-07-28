import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import type { MissingEssential } from '@/workbench/engine/essentials';

/**
 * Names the blanks before they reach a document.
 *
 * These fields render as an em-dash on the cover page, which is how a review
 * pack ends up in front of a risk committee with no named owner on it.
 */
export function EssentialsNotice({
  missing,
  editHref,
}: {
  missing: MissingEssential[];
  editHref: string;
}) {
  if (missing.length === 0) return null;

  return (
    <div className="rounded-lg border border-warning/40 bg-warning/8 p-4">
      <div className="flex gap-3">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.55_0.13_75)]" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">
            {missing.length} {missing.length === 1 ? 'field is' : 'fields are'} still blank
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            These show as a dash on the review document, and every reviewer asks for them.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {missing.map((m) => (
              <li key={String(m.field)}>
                <span className="font-medium">{m.label}</span>
                <span className="text-muted-foreground"> — {m.why}</span>
              </li>
            ))}
          </ul>
          <Link
            href={editHref}
            className="mt-3 inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Fill them in
          </Link>
        </div>
      </div>
    </div>
  );
}
