import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const adminClient = createAdminClient();
  const [{ count: unitsCount }, { count: pendingExpensesCount }, { data: approvedExpenses }] =
    await Promise.all([
      adminClient.from("units").select("id", { count: "exact", head: true }).eq("activo", true),
      adminClient
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendiente"),
      adminClient.from("expenses").select("monto").eq("estado", "aprobado")
    ]);
  const approvedExpensesTotal = (approvedExpenses ?? []).reduce(
    (sum, expense) => sum + Number(expense.monto),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard global</h1>
        <p className="text-sm text-muted-foreground">
          Resumen operativo conectado a los datos actuales.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Unidades activas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{unitsCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos aprobados</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatCurrency(approvedExpensesTotal)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos pendientes</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {pendingExpensesCount ?? 0}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
