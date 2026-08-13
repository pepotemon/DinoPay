export default function Loading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-7 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="h-9 w-9 rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border bg-background p-4 shadow-sm space-y-1.5">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-7 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 rounded-xl bg-muted" />
              <div className="h-11 rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
