import { ClipboardList, PlusCircle, ReceiptText } from "lucide-react";
import { createExpenseAction } from "@/lib/actions/unidad/gastos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";

const expenseCategories = [
  "Gasolina / Combustible",
  "Alimentacion",
  "Transporte",
  "Papeleria",
  "Comunicaciones",
  "Otros"
];

type ExpenseRow = {
  id: string;
  categoria: string;
  monto: number;
  nota: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha: string;
  created_at: string;
};

function statusLabel(status: ExpenseRow["estado"]) {
  if (status === "aprobado") {
    return "Aprobado";
  }

  if (status === "rechazado") {
    return "Rechazado";
  }

  return "Pendiente";
}

function statusClassName(status: ExpenseRow["estado"]) {
  return cn(
    "inline-flex rounded-md px-2 py-1 text-xs font-medium",
    status === "pendiente" && "bg-amber-100 text-amber-900",
    status === "aprobado" && "bg-emerald-100 text-emerald-900",
    status === "rechazado" && "bg-destructive/10 text-destructive"
  );
}

export default async function GastosPage({
  searchParams
}: {
  searchParams?: Promise<{
    ok?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: expenses } = user
    ? await adminClient
        .from("expenses")
        .select("id, categoria, monto, nota, estado, fecha, created_at")
        .eq("unit_id", user.id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };

  const rows = (expenses ?? []) as ExpenseRow[];
  const pendingRows = rows.filter((expense) => expense.estado === "pendiente");
  const approvedRows = rows.filter((expense) => expense.estado === "aprobado");
  const pendingTotal = pendingRows.reduce((sum, expense) => sum + Number(expense.monto), 0);
  const approvedTotal = approvedRows.reduce((sum, expense) => sum + Number(expense.monto), 0);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Registra gastos operativos para que el admin los apruebe.
          </p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <ReceiptText className="h-5 w-5 text-primary" />
        </div>
      </div>

      {params?.ok ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {params.ok}
        </div>
      ) : null}

      {params?.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendiente</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(pendingTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{pendingRows.length} gastos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aprobado</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(approvedTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{approvedRows.length} gastos</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Nuevo gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createExpenseAction} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>Categoria</span>
              <select
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue=""
                name="categoria"
                required
              >
                <option disabled value="">
                  Seleccionar
                </option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Monto</span>
              <Input
                inputMode="decimal"
                min="0.01"
                name="monto"
                placeholder="0"
                required
                step="0.01"
                type="number"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Nota</span>
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="nota"
                placeholder="Opcional"
              />
            </label>

            <Button className="h-11 w-full" type="submit">
              Guardar gasto
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Gastos recientes</h2>
        </div>

        {rows.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{expense.categoria}</p>
                  <p className="text-sm text-muted-foreground">{expense.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(Number(expense.monto))}</p>
                  <span className={statusClassName(expense.estado)}>
                    {statusLabel(expense.estado)}
                  </span>
                </div>
              </div>

              {expense.nota ? (
                <p className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                  {expense.nota}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}

        {rows.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Todavia no hay gastos registrados para esta unidad.
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
