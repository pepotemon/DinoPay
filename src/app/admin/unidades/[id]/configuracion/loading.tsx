export default function Loading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-7 w-44 rounded-lg bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="h-8 w-28 rounded-xl bg-muted" />
      </div>

      {/* Form sections */}
      <div className="rounded-2xl border bg-background p-5 shadow-sm space-y-4">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-5 shadow-sm space-y-4">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-14 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      <div className="h-11 w-full rounded-xl bg-muted" />
    </div>
  );
}
