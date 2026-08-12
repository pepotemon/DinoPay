"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { createCapitalMovementAction } from "@/lib/actions/admin/capital";
import { cn, formatCurrency } from "@/lib/utils";

type Movement = {
  id: string;
  tipo: "ingreso" | "retiro";
  monto: number;
  nota: string | null;
  fecha: string;
};

type Props = {
  movements: Movement[];
  totalIngresos: number;
  totalRetiros: number;
  balance: number;
  modo: string;
  rangoDesde: string;
  rangoHasta: string;
  unitId: string;
  unitName: string;
};

const MODOS = [
  { key: "dia", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "año", label: "Año" }
] as const;

export function UnidadTransaccionesClient({
  movements,
  totalIngresos,
  totalRetiros,
  balance,
  modo,
  rangoDesde,
  rangoHasta,
  unitId,
  unitName
}: Props) {
  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <Link
          className="lg:hidden inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80 mb-3"
          href="/admin/unidades"
        >
          ← Unidades
        </Link>
        <h1 className="text-2xl font-semibold">Transacciones</h1>
        <p className="text-sm text-muted-foreground">{unitName}</p>
      </div>

      {/* Period filter pills */}
      <div className="flex flex-wrap gap-2">
        {MODOS.map((m) => {
          const isActive = modo === m.key;
          return isActive ? (
            <span
              key={m.key}
              className="rounded-xl px-3 py-1.5 text-sm font-medium bg-primary text-white pointer-events-none select-none"
            >
              {m.label}
            </span>
          ) : (
            <Link
              key={m.key}
              href={`?modo=${m.key}`}
              className="rounded-xl px-3 py-1.5 text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              {m.label}
            </Link>
          );
        })}
        {modo === "custom" && (
          <span className="rounded-xl px-3 py-1.5 text-sm font-medium bg-primary text-white pointer-events-none select-none">
            Personalizado
          </span>
        )}
      </div>

      {/* Custom date range form — always visible */}
      <form
        action=""
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-background p-4"
      >
        <input type="hidden" name="modo" value="custom" />
        <label className="flex-1 min-w-[130px] space-y-1 text-xs font-medium">
          <span>Desde</span>
          <input
            type="date"
            name="desde"
            defaultValue={rangoDesde}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex-1 min-w-[130px] space-y-1 text-xs font-medium">
          <span>Hasta</span>
          <input
            type="date"
            name="hasta"
            defaultValue={rangoHasta}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <button
          type="submit"
          className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Aplicar
        </button>
      </form>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total ingresos"
          value={totalIngresos}
          color="green"
          icon={<ArrowDownLeft className="h-4 w-4" />}
          subLabel={`${rangoDesde} al ${rangoHasta}`}
        />
        <MetricCard
          label="Total retiros"
          value={totalRetiros}
          color="red"
          icon={<ArrowUpRight className="h-4 w-4" />}
          subLabel={`${rangoDesde} al ${rangoHasta}`}
        />
        <MetricCard
          label="Balance"
          value={balance}
          color={balance >= 0 ? "green" : "red"}
          subLabel={`${rangoDesde} al ${rangoHasta}`}
        />
      </div>

      {/* New movement form */}
      <NewMovementForm unitId={unitId} />

      {/* Movements list */}
      <div className="rounded-2xl border bg-background shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <p className="font-semibold">Movimientos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rangoDesde === rangoHasta ? rangoDesde : `${rangoDesde} al ${rangoHasta}`}
          </p>
        </div>
        <div className="divide-y">
          {movements.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin movimientos en este período.
            </div>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      m.tipo === "ingreso"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    )}
                  >
                    {m.tipo === "ingreso" ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {m.fecha}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          m.tipo === "ingreso"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {m.tipo === "ingreso" ? "Ingreso" : "Retiro"}
                      </span>
                    </div>
                    {m.nota ? (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {m.nota}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p
                  className={cn(
                    "shrink-0 font-semibold text-sm",
                    m.tipo === "ingreso" ? "text-green-700" : "text-red-600"
                  )}
                >
                  {m.tipo === "retiro" ? "-" : "+"}
                  {formatCurrency(m.monto)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
  subLabel
}: {
  label: string;
  value: number;
  color: "green" | "red";
  icon?: React.ReactNode;
  subLabel?: string;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon ? (
          <span
            className={cn(
              "rounded-md p-1",
              color === "green"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            )}
          >
            {icon}
          </span>
        ) : null}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          color === "green" ? "text-green-700" : "text-red-600"
        )}
      >
        {formatCurrency(value)}
      </p>
      {subLabel ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{subLabel}</p>
      ) : null}
    </div>
  );
}

function NewMovementForm({ unitId }: { unitId: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => createCapitalMovementAction(formData));
  }

  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
      <p className="font-semibold">Nuevo movimiento</p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input type="hidden" name="unitId" value={unitId} />
        <input
          type="hidden"
          name="redirectTo"
          value={`/admin/unidades/${unitId}/transacciones`}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-medium">
            <span>Tipo</span>
            <select
              name="tipo"
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ingreso">Ingreso</option>
              <option value="retiro">Retiro</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span>Monto</span>
            <input
              name="monto"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <label className="block space-y-1 text-xs font-medium">
          <span>Nota (opcional)</span>
          <input
            name="nota"
            type="text"
            placeholder="Descripción del movimiento"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-50 transition-opacity"
        >
          {pending ? "Registrando…" : "Registrar movimiento"}
        </button>
      </form>
    </div>
  );
}
