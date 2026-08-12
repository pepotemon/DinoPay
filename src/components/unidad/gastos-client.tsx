"use client";

import {
  Banknote,
  CalendarDays,
  ChevronDown,
  Info,
  Loader2,
  Pencil,
  PlusCircle,
  Receipt,
  Trash2,
  X
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createExpenseAction, deleteExpenseAction } from "@/lib/actions/unidad/gastos";
import { cn, formatCurrency } from "@/lib/utils";
import { PageDino } from "@/components/unidad/page-dino";

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

export function GastosClient({ expenses, today }: { expenses: GastoRow[]; today: string }) {
  const router = useRouter();
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [showSheet, setShowSheet] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(
    () => expenses.filter((e) => e.fecha >= fechaDesde && e.fecha <= fechaHasta),
    [expenses, fechaDesde, fechaHasta]
  );

  const totalRango = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.monto), 0),
    [filtered]
  );

  function handleCreate(formData: FormData) {
    startCreateTransition(async () => {
      const result = await createExpenseAction({ ok: false, message: "" }, formData);
      if (result.ok) {
        toast.success(result.message);
        setShowSheet(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  async function handleDelete(expenseId: string) {
    setDeletingId(expenseId);
    const formData = new FormData();
    formData.set("expenseId", expenseId);
    const result = await deleteExpenseAction({ ok: false, message: "" }, formData);
    setDeletingId(null);
    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      {/* Hero */}
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div>
          <h1 className="text-4xl font-black">Gastos</h1>
          <p className="text-lg font-bold text-primary">Diarios {formatCurrency(totalRango)}</p>
        </div>
        <PageDino label="Gastos diarios" variant="expenses" />
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
              <ExpenseCard
                key={expense.id}
                expense={expense}
                isDeleting={deletingId === expense.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── New expense sheet ── */}
      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-5 pb-3 pt-1">
          <p className="text-xl font-black">Nuevo gasto</p>
          <button
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            onClick={() => setShowSheet(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          <form action={handleCreate} className="mx-auto max-w-md space-y-4 px-5 pt-4">
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

            <button
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-60"
              disabled={isCreating}
              type="submit"
            >
              {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {isCreating ? "Guardando…" : "Guardar gasto"}
            </button>
          </form>
        </div>
      </BottomSheet>
    </>
  );
}

function ExpenseCard({
  expense,
  isDeleting,
  onDelete
}: {
  expense: GastoRow;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) {
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
          <button
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 text-sm font-bold text-destructive disabled:opacity-50"
            disabled={isDeleting}
            type="button"
            onClick={() => onDelete(expense.id)}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
