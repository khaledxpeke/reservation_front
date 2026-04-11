export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-zinc-100 ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-zinc-200 bg-transparent p-6 sm:p-8 rounded-md">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-4 h-4 w-1/2" />
      <Skeleton className="mt-4 h-3 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-6 py-2 border-b border-zinc-100 last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
