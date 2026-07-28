export default function Loading() {
  return (
    <div className="space-y-5 pb-4">
      <div className="animate-pulse rounded-2xl bg-muted px-5 py-5">
        <div className="h-2.5 w-16 rounded bg-muted-foreground/20" />
        <div className="mt-2 h-7 w-48 rounded bg-muted-foreground/20" />
        <div className="mt-1 h-4 w-32 rounded bg-muted-foreground/20" />
      </div>

      <div className="overflow-hidden rounded-2xl border divide-y">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
