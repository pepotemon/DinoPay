export default function Loading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-7 w-52 rounded-lg bg-muted" />
        <div className="h-4 w-36 rounded bg-muted" />
      </div>

      <div className="h-10 w-full rounded-xl bg-muted" />

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-xl bg-muted" />
        ))}
      </div>

      <div className="h-4 w-20 rounded bg-muted" />

      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
            <div className="rounded-xl bg-muted/40 p-3 space-y-2.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="h-3 w-10 rounded bg-muted" />
                  <div className="h-6 w-20 rounded bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-14 rounded bg-muted" />
                  <div className="h-5 w-16 rounded bg-muted" />
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
