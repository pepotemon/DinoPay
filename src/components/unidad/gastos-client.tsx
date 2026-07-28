"use client";

import {
  Banknote,
  CalendarDays,
  ChevronDown,
  Info,
  Pencil,
  PlusCircle,
  Receipt,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createExpenseAction, deleteExpenseAction } from "@/lib/actions/unidad/gastos";
import { cn, formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  "Gasolina / Combustible",
  "Alimentacion",
  "Transporte",
  "Papeleria",
  "Comunicaciones",
  "Otros"
];

export type GastoRow = {
  id: string;
  categoria: string;
  monto: number;
  nota: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<GastoRow["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-destructive/10 text-destructive"
};
const STATUS_LABEL: Record<GastoRow["estado"], string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado"
};

const INPUT =
  "h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20";
const SELECT =
  "h-12 w-full appearance-none rounded-xl bg-green-50 px-4 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20";

export function GastosClient({ expenses }: { expenses: GastoRow[] }) {
  const today = todayStr();
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [showSheet, setShowSheet] = useState(false);

  const filtered = useMemo(
    () => expenses.filter((e) => e.fecha >= fechaDesde && e.fecha <= fechaHasta),
    [expenses, fechaDesde, fechaHasta]
  );

  const totalRango = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.monto), 0),
    [filtered]
  );

  return (
    <>
      {/* Hero */}
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div>
          <h1 className="text-4xl font-black">Gastos</h1>
          <p className="text-lg font-bold text-primary">Diarios {formatCurrency(totalRango)}</p>
        </div>
        <span className="select-none text-5xl">🧾</span>
      </div>

      <div className="space-y-4">
        {/* Nuevo gasto */}
        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity active:opacity-80"
          onClick={() => setShowSheet(true)}
          type="button"
        >
          <PlusCircle className="h-5 w-5" />
          Nuevo gasto
        </button>

        {/* Date range filter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-bold text-muted-foreground">Fecha Inicio</p>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                className="h-12 w-full rounded-xl bg-green-50 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                max={fechaHasta}
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold text-muted-foreground">Fecha Fin</p>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                className="h-12 w-full rounded-xl bg-green-50 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                min={fechaDesde}
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-black text-primary">Ten en cuenta</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Los gastos pendientes no se suman en el cálculo del cierre de caja hasta ser
              aprobados.
            </p>
          </div>
        </div>

        {/* Expense list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
            <Receipt className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">No hay gastos en este período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>

      {/* ── New expense sheet ── */}
      {showSheet ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowSheet(false)}
            type="button"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-background shadow-2xl">
            <div className="mx-auto max-w-md">
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="flex items-center gap-2 px-5 py-3">
                <p className="flex-1 text-xl font-black">Nuevo gasto</p>
                <button
                  className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground"
                  onClick={() => setShowSheet(false)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form action={createExpenseAction} className="space-y-4 px-5 pb-8">
                <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
                  {/* Category */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">
                      Categoría <span className="text-destructive">*</span>
                    </span>
                    <div className="relative">
                      <select
                        className={SELECT}
                        defaultValue=""
                        name="categoria"
                        required
                      >
                        <option disabled value="">
                          Seleccionar
                        </option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted-foreground" />
                    </div>
                  </label>

                  {/* Amount */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">
                      Monto <span className="text-destructive">*</span>
                    </span>
                    <div className="relative">
                      <Banknote className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-primary/50" />
                      <input
                        className={INPUT}
                        inputMode="decimal"
                        min="0.01"
                        name="monto"
                        placeholder="0"
                        required
                        step="0.01"
                        type="number"
                      />
                    </div>
                  </label>

                  {/* Note */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">Nota</span>
                    <textarea
                      className="min-h-[80px] w-full resize-none rounded-xl bg-green-50 px-4 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                      name="nota"
                      placeholder="Opcional…"
                    />
                  </label>
                </section>

                <SheetSubmitButton />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SheetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="h-14 w-full rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando…" : "Guardar gasto"}
    </button>
  );
}

function ExpenseCard({ expense }: { expense: GastoRow }) {
  return (
    <div className="space-y-3 rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black">{expense.categoria}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateNice(expense.fecha)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black">{formatCurrency(Number(expense.monto))}</p>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black",
              STATUS_STYLE[expense.estado]
            )}
          >
            {STATUS_LABEL[expense.estado]}
          </span>
        </div>
      </div>

      {expense.nota ? (
        <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          {expense.nota}
        </p>
      ) : null}

      {expense.estado === "pendiente" ? (
        <div className="grid grid-cols-2 gap-2">
          <Link
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-bold"
            href={`/unidad/gastos/${expense.id}/editar`}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <form action={deleteExpenseAction}>
            <input name="expenseId" type="hidden" value={expense.id} />
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-sm font-bold text-destructive"
              type="submit"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
