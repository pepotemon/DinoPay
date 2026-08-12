"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type UnitOption = {
  id: string;
  nombre_unidad: string;
  activo: boolean;
};

export function RouteSelector({
  units,
  currentUnitId,
  currentUnitName
}: {
  units: UnitOption[];
  currentUnitId: string;
  currentUnitName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Extract the last segment: "clientes" | "transacciones" | "configuracion"
  const section = pathname.split("/").filter(Boolean).pop() ?? "clientes";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-muted transition-colors max-w-[200px]"
      >
        <span className="truncate">{currentUnitName}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded-xl border bg-background shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cambiar ruta</p>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {units.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/admin/unidades/${u.id}/${section}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                    u.id === currentUnitId && "bg-muted/60"
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn("truncate font-medium", !u.activo && "text-muted-foreground")}>
                      {u.nombre_unidad}
                    </p>
                    {!u.activo && (
                      <p className="text-xs text-muted-foreground">Inactiva</p>
                    )}
                  </div>
                  {u.id === currentUnitId && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
