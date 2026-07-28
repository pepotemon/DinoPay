export default function Loading() {
  return (
    <div className="pb-6 animate-pulse space-y-4">
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div className="space-y-2">
          <div className="h-10 w-36 rounded-xl bg-muted" />
          <div className="h-6 w-40 rounded-lg bg-muted" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-muted" />
      </div>

      <div className="h-12 rounded-xl bg-muted" />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-7 w-24 rounded bg-muted" />
        </div>
        <div className="rounded-2xl border p-4">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-7 w-24 rounded bg-muted" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-muted" />
        <div className="h-10 flex-1 rounded-xl bg-muted" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
