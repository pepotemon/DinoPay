"use client";

import Link from "next/link";
import { X, Users2, ArrowLeftRight, Settings2, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Unit = {
  id: string;
  nombre_unidad: string;
  encargado: string;
  ciudad: string;
  activo: boolean;
  stats: { cartera: number; meta: number; activeClients: number };
};

interface UnitQuickModalProps {
  unit: Unit | null;
  onClose: () => void;
}

const NAV_OPTIONS = [
  {
    key: "clientes",
    icon: Users2,
    title: "Clientes y préstamos",
    desc: "Lista de clientes activos y su cartera",
    href: (id: string) => `/admin/unidades/${id}/clientes`
  },
  {
    key: "transacciones",
    icon: ArrowLeftRight,
    title: "Transacciones",
    desc: "Movimientos de capital, ingresos y retiros",
    href: (id: string) => `/admin/unidades/${id}/transacciones`
  },
  {
    key: "configuracion",
    icon: Settings2,
    title: "Configuración",
    desc: "Ajustes de la ruta e información operativa",
    href: (id: string) => `/admin/unidades/${id}/configuracion`
  }
];

export function UnitQuickModal({ unit, onClose }: UnitQuickModalProps) {
  if (!unit) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-md rounded-2xl max-h-[88dvh] overflow-y-auto bg-background shadow-2xl border border-border/60">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-4 border-b">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold truncate leading-tight">
                {unit.nombre_unidad}
              </h2>
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
            <p className="mt-0.5 text-sm text-muted-foreground">
              {unit.encargado} · {unit.ciudad}
            </p>
          </div>
          <button
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b">
          <div>
            <p className="text-xs text-muted-foreground">Cartera</p>
            <p className="font-semibold text-primary text-sm">
              {formatCurrency(unit.stats.cartera)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Clientes activos</p>
            <p className="font-semibold text-sm">{unit.stats.activeClients}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Meta día</p>
            <p className="font-semibold text-sm">
              {formatCurrency(unit.stats.meta)}
            </p>
          </div>
        </div>

        {/* Navigation options */}
        <div className="p-4 space-y-2">
          {NAV_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <Link
                key={opt.key}
                href={opt.href(unit.id)}
                onClick={onClose}
                className="flex items-center gap-4 rounded-xl border bg-background p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {opt.desc}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
