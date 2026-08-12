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

export function UnitsListClient({ units }: { units: Unit[] }) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  return (
    <>
      <div className="space-y-3">
        {units.map((unit) => (
          <button
            key={unit.id}
            type="button"
            className="w-full text-left rounded-2xl border bg-background p-4 shadow-sm transition-colors hover:bg-muted/40 active:bg-muted/60 cursor-pointer"
            onClick={() => setSelectedUnit(unit)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{unit.nombre_unidad}</p>
                <p className="text-sm text-muted-foreground">@{unit.username}</p>
                <p className="text-xs text-muted-foreground">
                  {unit.encargado} · {unit.ciudad}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  unit.activo
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {unit.activo ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cartera</p>
                <p className="font-semibold text-primary">
                  {formatCurrency(unit.stats.cartera)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientes activos</p>
                <p className="font-semibold">{unit.stats.activeClients}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Meta día</p>
                <p className="font-semibold">{formatCurrency(unit.stats.meta)}</p>
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
