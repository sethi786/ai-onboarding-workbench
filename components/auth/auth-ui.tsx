import { cn } from '@/lib/utils';

/** Dark-surface input + label for the auth card. */
export function AuthInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/40',
        className,
      )}
      {...props}
    />
  );
}

export function AuthLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-slate-300">
      {children}
    </label>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-red-300">
      {message}
    </div>
  );
}

export function AuthSubmit({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="h-10 w-full rounded-md bg-electric text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}
