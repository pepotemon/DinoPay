"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UpdateExpenseState } from "@/lib/actions/unidad/gastos";

const expenseCategories = [
  "Gasolina / Combustible",
  "Alimentacion",
  "Transporte",
  "Papeleria",
  "Comunicaciones",
  "Otros"
];

type Action = (prev: UpdateExpenseState, formData: FormData) => Promise<UpdateExpenseState>;

type Defaults = {
  expenseId: string;
  categoria: string;
  monto: number;
  nota: string | null;
};

const initialState: UpdateExpenseState = { ok: false, message: "" };

export function EditExpenseForm({
  updateExpense,
  defaults
}: {
  updateExpense: Action;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState(updateExpense, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="expenseId" type="hidden" value={defaults.expenseId} />

      <Card>
        <CardHeader>
          <CardTitle>Datos del gasto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            <span>Categoria</span>
            <select
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.categoria}
              name="categoria"
              required
            >
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Monto</span>
            <Input
              defaultValue={defaults.monto}
              inputMode="decimal"
              min="0.01"
              name="monto"
              required
              step="0.01"
              type="number"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Nota</span>
            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.nota ?? ""}
              name="nota"
              placeholder="Opcional"
            />
          </label>
        </CardContent>
      </Card>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar cambios
      </Button>
    </form>
  );
}
