import { cn } from '@/lib/utils';

/** Clearance AI shield mark + wordmark. `tone` adapts to light/dark surfaces. */
export function ShieldLogo({
  className,
  tone = 'dark',
  showWord = true,
}: {
  className?: string;
  tone?: 'dark' | 'light';
  showWord?: boolean;
}) {
  const word = tone === 'light' ? 'text-white' : 'text-foreground';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative grid h-8 w-8 place-items-center rounded-md',
          tone === 'light' ? 'bg-white/5 ring-1 ring-white/10' : 'bg-navy-deep',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M12 3l7 3v5c0 4.2-2.9 7.8-7 8.9C7.9 18.8 5 15.2 5 11V6l7-3z"
            className="fill-electric/15 stroke-electric"
            strokeWidth="1.5"
          />
          <path
            d="M8.7 12.1l2.3 2.3 4.3-4.6"
            className="stroke-electric"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute inset-0 rounded-md ring-1 ring-electric/30" />
      </span>
      {showWord && (
        <span className={cn('text-[15px] font-semibold tracking-tight', word)}>
          Clearance<span className="text-electric"> AI</span>
        </span>
      )}
    </span>
  );
}
