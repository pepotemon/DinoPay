import { PlusCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes disponibles</h1>
          <p className="text-sm text-muted-foreground">Clientes activos sin préstamo activo.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground opacity-60">
          <PlusCircle className="h-4 w-4" />
          Nuevo
        </div>
      </div>

      <div className="animate-pulse space-y-3">
        <div className="h-24 rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="h-5 w-40 rounded bg-muted" />
                  <div className="h-3.5 w-56 rounded bg-muted" />
                  <div className="h-3.5 w-28 rounded bg-muted" />
                </div>
                <div className="h-6 w-16 rounded-md bg-muted" />
              </div>
              <div className="h-20 rounded-md bg-muted" />
              <div className="h-12 w-full rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
