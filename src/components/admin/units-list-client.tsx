"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { UnitQuickModal } from "@/components/admin/unit-quick-modal";

type Unit = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  ciudad: string;
  activo: boolean;
  stats: { cartera: number; meta: number; activeClients: number };
};

function UnitAvatar({ name, activo }: { name: string; activo: boolean }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm",
        activo ? "bg-primary" : "bg-muted-foreground/50"
      )}
    >
      {initials}
    </div>
  );
}

export function UnitsListClient({ units }: { units: Unit[] }) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  return (
    <>
      <div className="space-y-3">
        {units.map((unit) => (
          <button
            key={unit.id}
            type="button"
            className="group w-full text-left rounded-2xl border bg-background shadow-sm cursor-pointer overflow-hidden transition-all duration-150 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
            onClick={() => setSelectedUnit(unit)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <UnitAvatar name={unit.nombre_unidad} activo={unit.activo} />
                  <div className="min-w-0">
                    <p className="font-bold text-base leading-tight">{unit.nombre_unidad}</p>
                    <p className="text-sm text-muted-foreground">@{unit.username}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {unit.encargado} · {unit.ciudad}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    unit.activo
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {unit.activo ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Cartera
                  </p>
                  <p className="font-bold text-sm text-primary mt-0.5">
                    {formatCurrency(unit.stats.cartera)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Clientes
                  </p>
                  <p className="font-bold text-sm mt-0.5">{unit.stats.activeClients}</p>
                </div>
                <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Meta día
                  </p>
                  <p className="font-bold text-sm mt-0.5">{formatCurrency(unit.stats.meta)}</p>
                </div>
              </div>
            </div>
          </button>
        ))}

        {units.length === 0 ? (
          <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground shadow-sm">
            No hay unidades registradas aún.
          </div>
        ) : null}
      </div>

      <UnitQuickModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
    </>
  );
}
