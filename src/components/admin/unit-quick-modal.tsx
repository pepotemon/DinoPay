"use client";

import { useRef } from "react";
import Link from "next/link";
import { Users2, ArrowLeftRight, Settings2, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { SlideOver } from "@/components/admin/slide-over";

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
  // Keep last non-null value so content stays during close animation
  const lastRef = useRef<Unit | null>(null);
  if (unit) lastRef.current = unit;
  const u = lastRef.current;

  return (
    <SlideOver
      open={unit !== null}
      onClose={onClose}
      title={u?.nombre_unidad ?? ""}
      description={
        u ? (
          <span className="flex flex-wrap items-center gap-2">
            <span>{u.encargado} · {u.ciudad}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                u.activo
                  ? "bg-green-100 text-green-800"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {u.activo ? "Activa" : "Inactiva"}
            </span>
          </span>
        ) : undefined
      }
    >
      {u && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 border-b border-border/40 px-5 py-5 lg:px-7">
            <div>
              <p className="text-xs text-muted-foreground">Cartera</p>
              <p className="font-semibold text-primary text-sm mt-0.5">
                {formatCurrency(u.stats.cartera)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clientes</p>
              <p className="font-semibold text-sm mt-0.5">{u.stats.activeClients}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Meta hoy</p>
              <p className="font-semibold text-sm mt-0.5">
                {formatCurrency(u.stats.meta)}
              </p>
            </div>
          </div>

          {/* Navigation options */}
          <div className="p-4 lg:p-5 space-y-2">
            {NAV_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Link
                  key={opt.key}
                  href={opt.href(u.id)}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl border border-transparent bg-muted/30 p-4 hover:bg-muted/60 hover:border-border/50 transition-all group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-tight">{opt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {opt.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </SlideOver>
  );
}
