export default function Loading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-7 w-52 rounded-lg bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
        </div>
        <div className="h-8 w-28 rounded-xl bg-muted" />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-20 shrink-0 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border bg-background p-3 shadow-sm space-y-1.5">
            <div className="h-3 w-14 rounded bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Movement rows */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border bg-background px-4 py-3 shadow-sm">
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
