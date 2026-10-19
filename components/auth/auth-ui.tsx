'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Light-surface input + label for the auth form. */
export function AuthInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl border border-input bg-card px-4 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/20 disabled:opacity-60 sm:text-sm',
        className,
      )}
      {...props}
      name={props.name || props.id}
    />
  );
}

export function AuthPasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthInput
        {...props}
        type={visible ? 'text' : 'password'}
        className="pr-14"
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        disabled={props.disabled}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-1 top-1 grid h-10 w-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-foreground"
    >
      {children}
    </label>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message) alert.current?.focus();
  }, [message]);
  if (!message) return null;
  return (
    <div
      role="alert"
      ref={alert}
      tabIndex={-1}
      className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  );
}

export function AuthSubmit({
  children,
  className,
  type = 'submit',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-electric disabled:cursor-wait disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
