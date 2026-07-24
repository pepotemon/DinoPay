export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse overflow-hidden rounded-lg border bg-card">
        <div className="border-b p-6">
          <div className="h-6 w-52 rounded bg-muted" />
          <div className="mt-2 h-4 w-72 rounded bg-muted" />
        </div>
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-10 rounded-md bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-px bg-muted" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-muted" />
                <div className="h-10 rounded-md bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-24 rounded-md bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
