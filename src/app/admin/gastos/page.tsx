import { CheckCircle2, ReceiptText, XCircle } from "lucide-react";
import { decideExpenseAction } from "@/lib/actions/admin/gastos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type PendingExpenseRow = {
  id: string;
  categoria: string;
  monto: number;
  nota: string | null;
  fecha: string;
  creado_por: string;
  units:
    | {
        username: string;
        nombre_unidad: string;
      }
    | {
        username: string;
        nombre_unidad: string;
      }[]
    | null;
};

export default async function AdminGastosPage({
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
        .select("id, categoria, monto, nota, fecha, creado_por, units(username, nombre_unidad)")
        .eq("estado", "pendiente")
        .order("fecha", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  const rows = ((expenses ?? []) as unknown as PendingExpenseRow[]).map((expense) => ({
    ...expense,
    units: Array.isArray(expense.units) ? expense.units[0] ?? null : expense.units
  }));
  const pendingTotal = rows.reduce((sum, expense) => sum + Number(expense.monto), 0);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Aprobar gastos</h1>
          <p className="text-sm text-muted-foreground">
            Revisa los gastos pendientes antes de que afecten la caja.
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
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(pendingTotal)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        {rows.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{expense.units?.nombre_unidad ?? "Unidad"}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.units?.username ?? expense.creado_por} - {expense.fecha}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(Number(expense.monto))}</p>
                  <p className="text-sm text-muted-foreground">{expense.categoria}</p>
                </div>
              </div>

              {expense.nota ? (
                <p className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                  {expense.nota}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <form action={decideExpenseAction}>
                  <input name="expenseId" type="hidden" value={expense.id} />
                  <input name="decision" type="hidden" value="rechazado" />
                  <Button className="h-11 w-full" type="submit" variant="secondary">
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </Button>
                </form>
                <form action={decideExpenseAction}>
                  <input name="expenseId" type="hidden" value={expense.id} />
                  <input name="decision" type="hidden" value="aprobado" />
                  <Button className="h-11 w-full" type="submit">
                    <CheckCircle2 className="h-4 w-4" />
                    Aprobar
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}

        {rows.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay gastos pendientes por aprobar.
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
