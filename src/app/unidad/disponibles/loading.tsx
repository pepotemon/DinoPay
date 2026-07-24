export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-52 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="animate-pulse space-y-3">
        <div className="h-24 rounded-lg bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
