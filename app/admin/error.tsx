'use client';
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main role="alert" className="mx-auto max-w-xl space-y-4 px-5 py-20">
      <h1 className="text-2xl font-semibold">Service checks unavailable</h1>
      <p className="text-muted-foreground">
        We couldn’t complete the checks. Retry, then inspect the deployment and
        database logs if this continues.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-electric px-5 py-3 text-white"
      >
        Retry checks
      </button>
    </main>
  );
}
