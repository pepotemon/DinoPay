"use client";

import { useState, useTransition } from "react";
import { createCapitalMovementAction } from "@/lib/actions/admin/capital";
import { decideExpenseFromHubAction } from "@/lib/actions/admin/unit-hub";
import { cn, formatCurrency } from "@/lib/utils";

type CapMov = {
  id: string;
  tipo: "ingreso" | "retiro";
  monto: number;
  nota: string | null;
  fecha: string;
};

type Expense = {
  id: string;
  categoria: string;
  monto: number;
  nota: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha: string;
  creado_por: string;
};

type ExpenseFilter = "pendientes" | "aprobados";

export function UnitTransactionsTab({
  unitId,
  capitalMovements,
  pendingExpenses,
  recentExpenses,
  cajaEstimada,
  carteraTotal,
  cobradoHoy,
  metaDia
}: {
  unitId: string;
  capitalMovements: CapMov[];
  pendingExpenses: Expense[];
  recentExpenses: Expense[];
  cajaEstimada: number;
  carteraTotal: number;
  cobradoHoy: number;
  metaDia: number;
}) {
  const [expenseFilter, setExpenseFilter] = useState<ExpenseFilter>("pendientes");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Caja estimada</p>
        <p
          className={cn(
            "mt-0.5 text-3xl font-bold",
            cajaEstimada >= 0 ? "text-primary" : "text-destructive"
          )}
        >
          {formatCurrency(cajaEstimada)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Cartera</p>
            <p className="text-sm font-semibold">{formatCurrency(carteraTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cobrado hoy</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(cobradoHoy)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Meta día</p>
            <p className="text-sm font-semibold">{formatCurrency(metaDia)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
        <p className="font-semibold">Movimientos de capital</p>

        <div className="space-y-2">
          {capitalMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
          ) : (
            capitalMovements.map((m) => (
              <div
                className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 text-sm"
                key={m.id}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-base font-bold",
                      m.tipo === "ingreso" ? "text-green-600" : "text-red-500"
                    )}
                  >
                    {m.tipo === "ingreso" ? "↑" : "↓"}
                  </span>
                  <div>
                    <p className="font-medium capitalize">{m.tipo}</p>
                    {m.nota ? (
                      <p className="text-xs text-muted-foreground">{m.nota}</p>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold",
                      m.tipo === "ingreso" ? "text-green-700" : "text-red-600"
                    )}
                  >
                    {m.tipo === "retiro" ? "-" : "+"}
                    {formatCurrency(m.monto)}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.fecha}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <NewCapitalMovementForm unitId={unitId} />
      </div>

      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
        <p className="font-semibold">Gastos de la unidad</p>

        <div className="flex gap-2">
          <button
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              expenseFilter === "pendientes"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => setExpenseFilter("pendientes")}
            type="button"
          >
            Pendientes ({pendingExpenses.length})
          </button>
          <button
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              expenseFilter === "aprobados"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => setExpenseFilter("aprobados")}
            type="button"
          >
            Aprobados
          </button>
        </div>

        {expenseFilter === "pendientes" ? (
          <PendingExpensesList expenses={pendingExpenses} unitId={unitId} />
        ) : (
          <ApprovedExpensesList expenses={recentExpenses} />
        )}
      </div>
    </div>
  );
}

function NewCapitalMovementForm({ unitId }: { unitId: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => createCapitalMovementAction(formData));
  }

  return (
    <form className="space-y-3 border-t pt-4" onSubmit={handleSubmit}>
      <input name="unitId" type="hidden" value={unitId} />
      <p className="text-sm font-medium">Nuevo movimiento</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs font-medium">
          <span>Tipo</span>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            name="tipo"
          >
            <option value="ingreso">Ingreso</option>
            <option value="retiro">Retiro</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium">
          <span>Monto</span>
          <input
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            inputMode="decimal"
            min="0.01"
            name="monto"
            placeholder="0"
            required
            step="0.01"
            type="number"
          />
        </label>
      </div>
      <label className="block space-y-1 text-xs font-medium">
        <span>Nota</span>
        <input
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="nota"
          placeholder="Opcional"
          type="text"
        />
      </label>
      <button
        className="h-10 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Registrando…" : "Registrar movimiento"}
      </button>
    </form>
  );
}

function PendingExpensesList({
  expenses,
  unitId
}: {
  expenses: Expense[];
  unitId: string;
}) {
  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin gastos pendientes.</p>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((e) => (
        <PendingExpenseCard expense={e} key={e.id} unitId={unitId} />
      ))}
    </div>
  );
}

function PendingExpenseCard({
  expense,
  unitId
}: {
  expense: Expense;
  unitId: string;
}) {
  const [pending, startTransition] = useTransition();

  function decide(decision: "aprobado" | "rechazado") {
    const formData = new FormData();
    formData.set("expenseId", expense.id);
    formData.set("unitId", unitId);
    formData.set("decision", decision);
    startTransition(() => decideExpenseFromHubAction(formData));
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium capitalize">{expense.categoria}</p>
          {expense.nota ? (
            <p className="text-xs text-muted-foreground">{expense.nota}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Por: {expense.creado_por} · {expense.fecha}
          </p>
        </div>
        <p className="shrink-0 font-semibold">{formatCurrency(expense.monto)}</p>
      </div>
      <div className="flex gap-2">
        <button
          className="h-9 flex-1 rounded-xl bg-primary font-bold text-white text-sm disabled:opacity-50"
          disabled={pending}
          onClick={() => decide("aprobado")}
          type="button"
        >
          Aprobar
        </button>
        <button
          className="h-9 flex-1 rounded-xl bg-muted font-medium text-foreground text-sm disabled:opacity-50"
          disabled={pending}
          onClick={() => decide("rechazado")}
          type="button"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}

function ApprovedExpensesList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin gastos aprobados.</p>;
  }

  return (
    <div className="space-y-2">
      {expenses.map((e) => (
        <div
          className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-sm"
          key={e.id}
        >
          <div>
            <p className="font-medium capitalize">{e.categoria}</p>
            <p className="text-xs text-muted-foreground">{e.fecha}</p>
          </div>
          <p className="font-semibold">{formatCurrency(e.monto)}</p>
        </div>
      ))}
    </div>
  );
}
