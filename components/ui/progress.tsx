import { cn } from '@/lib/utils';

/**
 * A completion bar.
 *
 * Neutral by default, deliberately. It used to colour itself by value — green
 * above 85, amber, then orange, then red — so a review half way through its
 * first week rendered as an emergency. That conflates "incomplete" with "bad",
 * which is precisely the distinction this product exists to draw: a review
 * nobody has finished is not a review that failed. The verdict is carried by
 * the decision badge beside it, which is where a reader looks for one.
 *
 * Pass `band` for the few places where the number genuinely is a judgement
 * rather than a measure of progress.
 */
export function Progress({
  value,
  className,
  showLabel,
  band,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  /** Colour by value band. Only for figures that are a verdict, not progress. */
  band?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color = !band
    ? 'bg-foreground/70'
    : v >= 85
      ? 'bg-success'
      : v >= 70
        ? 'bg-warning'
        : v >= 50
          ? 'bg-[oklch(0.65_0.18_50)]'
          : 'bg-danger';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && (
        <span className="w-9 text-right font-mono text-xs text-muted-foreground">{v}%</span>
      )}
    </div>
  );
}
