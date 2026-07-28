import { MapPinned } from "lucide-react";

export default function Loading() {
  return (
    <>
      {/* ── Cabecera sticky (estructura real) ── */}
      <div className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto max-w-md space-y-3 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                DinoPay
              </p>
              <h1 className="text-2xl font-black leading-tight">Cuotas del Día</h1>
              <div className="mt-0.5 h-2.5 w-36 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold text-muted-foreground">
              <MapPinned className="h-4 w-4" />
              Enrutar
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-0 rounded-full bg-primary" />
          </div>

          <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />

          <div className="grid grid-cols-3 rounded-xl bg-muted p-0.5">
            {(["Todos", "Pendientes", "Visitados"] as const).map((label, i) => (
              <div
                key={label}
                className={`flex h-8 items-center justify-center rounded-lg text-xs font-black ${
                  i === 1 ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lista skeleton ── */}
      <div className="mx-auto w-full max-w-md divide-y px-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-3.5 py-4">
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div
                className="h-4 animate-pulse rounded bg-muted"
                style={{ width: `${45 + (i * 17) % 35}%` }}
              />
              <div
                className="h-3 animate-pulse rounded bg-muted"
                style={{ width: `${30 + (i * 11) % 30}%` }}
              />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}
