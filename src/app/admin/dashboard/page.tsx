import { Building2, DollarSign, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const adminClient = createAdminClient();

  const [
    { count: unitsCount },
    { count: pendingExpensesCount },
    { data: approvedExpenses },
    { data: activeLoans }
  ] = await Promise.all([
    adminClient.from("units").select("id", { count: "exact", head: true }).eq("activo", true),
    adminClient
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    adminClient.from("expenses").select("monto").eq("estado", "aprobado"),
    adminClient.from("loans").select("saldo, valor_cuota").eq("estado", "activo")
  ]);

  const approvedExpensesTotal = (approvedExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.monto),
    0
  );
  const carteraTotal = (activeLoans ?? []).reduce((sum, l) => sum + Number(l.saldo), 0);
  const metaDia = (activeLoans ?? []).reduce((sum, l) => sum + Number(l.valor_cuota), 0);

  const metrics = [
    {
      label: "Unidades activas",
      value: String(unitsCount ?? 0),
      icon: Building2,
      href: "/admin/unidades",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Cartera total",
      value: formatCurrency(carteraTotal),
      icon: TrendingUp,
      href: "/admin/unidades",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Meta del día",
      value: formatCurrency(metaDia),
      icon: DollarSign,
      href: "/admin/unidades",
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      label: "Gastos pendientes",
      value: String(pendingExpensesCount ?? 0),
      icon: Receipt,
      href: "/admin/gastos",
      color: pendingExpensesCount ? "text-amber-600" : "text-muted-foreground",
      bg: pendingExpensesCount ? "bg-amber-50" : "bg-muted"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen operativo en tiempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="group rounded-2xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                <p className="mt-1.5 text-2xl font-bold">{m.value}</p>
              </div>
              <span className={`rounded-xl p-2.5 ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border bg-background p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Total gastos aprobados</p>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(approvedExpensesTotal)}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Suma histórica de todos los gastos aprobados en todas las unidades.
        </p>
      </div>
    </div>
  );
}
