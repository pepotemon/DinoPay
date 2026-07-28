export default function Loading() {
  return (
    <div className="pb-6">
      <div className="flex items-end justify-between px-1 pb-6 pt-2">
        <div>
          <h1 className="text-4xl font-black">Nuevo</h1>
          <p className="text-lg font-bold text-primary">Cliente</p>
        </div>
        <span className="select-none text-5xl">💸</span>
      </div>

      <div className="max-w-lg mx-auto space-y-4 animate-pulse">
        {[5, 3, 4].map((fields, si) => (
          <div key={si} className="rounded-2xl border p-5 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
            {Array.from({ length: fields > 3 ? 3 : fields }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-12 rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        ))}
        <div className="h-14 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
