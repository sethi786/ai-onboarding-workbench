import { cn } from '@/lib/utils';

/** Light-surface input + label for the auth form. */
export function AuthInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/30',
        className,
      )}
      {...props}
    />
  );
}

export function AuthLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
      {message}
    </div>
  );
}

export function AuthSubmit({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="h-11 w-full rounded-lg bg-electric text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
      {...props}
    />
  );
}
