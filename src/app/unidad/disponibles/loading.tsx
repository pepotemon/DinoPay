export default function Loading() {
  return (
    <div className="pb-6">
      <div className="flex items-end justify-between px-1 pb-6 pt-2">
        <div>
          <h1 className="text-4xl font-black">Clientes</h1>
          <p className="text-lg font-bold text-primary">Disponibles</p>
        </div>
        <span className="select-none text-5xl">🤝</span>
      </div>

      <div className="animate-pulse space-y-4">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-muted" />
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-3 w-44 rounded bg-muted" />
                  <div className="h-3 w-52 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-3 h-11 rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
