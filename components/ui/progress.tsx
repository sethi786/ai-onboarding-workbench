import { cn } from '@/lib/utils';

/** Readiness/completeness bar. Colour follows the value band unless overridden. */
export function Progress({
  value,
  className,
  showLabel,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    v >= 85
      ? 'bg-success'
      : v >= 70
        ? 'bg-warning'
        : v >= 50
          ? 'bg-[oklch(0.65_0.18_50)]'
          : 'bg-danger';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-9 text-right font-mono text-xs text-muted-foreground">{v}%</span>}
    </div>
  );
}
