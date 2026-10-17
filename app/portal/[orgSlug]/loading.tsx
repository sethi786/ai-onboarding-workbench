import { Skeleton } from '@/components/ui/Skeleton';
export default function WorkspaceLoading() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-3/4 max-w-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <span className="sr-only">Loading your workspace. Please wait.</span>
    </div>
  );
}
