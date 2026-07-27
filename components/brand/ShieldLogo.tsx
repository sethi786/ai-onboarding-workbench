import { cn } from '@/lib/utils';

/** Aegis shield mark + wordmark. `tone` adapts to light/dark surfaces. */
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
          'grid h-8 w-8 place-items-center rounded-[0.6rem]',
          tone === 'light' ? 'bg-white/10 ring-1 ring-white/15' : 'bg-ink',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M12 2.5l7.5 3.2v5.1c0 4.6-3.1 8.4-7.5 9.7-4.4-1.3-7.5-5.1-7.5-9.7V5.7L12 2.5z"
            className="fill-electric"
          />
          <path
            d="M8.5 12.2l2.5 2.5 4.6-5"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWord && (
        <span className={cn('text-[17px] font-semibold tracking-[-0.02em]', word)}>Aegis</span>
      )}
    </span>
  );
}
