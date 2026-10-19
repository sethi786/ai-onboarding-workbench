'use client';

export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">We couldn’t load your workspace data</h2>
      <p className="text-sm text-muted-foreground">The current review results are unavailable. Check your connection and try again.</p>
      <button onClick={reset} className="rounded-md bg-electric px-4 py-2 text-sm text-white">Try again</button>
    </div>
  );
}
