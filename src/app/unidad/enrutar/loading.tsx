export default function Loading() {
  return (
    <div className="pb-6">
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div>
          <h1 className="text-4xl font-black">Enrutar</h1>
          <p className="text-lg font-bold text-primary">Cargando…</p>
        </div>
        <span className="select-none text-5xl">🗺️</span>
      </div>

      <div className="space-y-4 animate-pulse">
        <div className="h-14 rounded-2xl bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border p-3">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="h-7 w-7 rounded-lg bg-muted" />
                <div className="h-7 w-7 rounded-lg bg-muted" />
              </div>
              <div className="h-11 w-10 rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
