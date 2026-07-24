import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function ReporteDiarioPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: unit },
    { data: todayPayments },
    { data: todayLoans },
    { data: todayExpenses },
    { data: activeLoans },
    { data: allPayments },
    { data: allLoans },
    { data: allExpenses },
    { data: todayVisits },
    { data: capitalMovements }
  ] = await Promise.all([
    adminClient.from("units").select("capital_inicial").eq("id", user.id).maybeSingle(),
    adminClient
      .from("payments")
      .select("loan_id, monto")
      .eq("unit_id", user.id)
      .eq("fecha_pago", today)
      .eq("eliminado", false),
    adminClient
      .from("loans")
      .select("valor_neto")
      .eq("unit_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`),
    adminClient
      .from("expenses")
      .select("monto, estado")
      .eq("unit_id", user.id)
      .eq("fecha", today),
    adminClient
      .from("loans")
      .select("id, saldo")
      .eq("unit_id", user.id)
      .eq("estado", "activo"),
    adminClient.from("payments").select("monto").eq("unit_id", user.id).eq("eliminado", false),
    adminClient.from("loans").select("valor_neto").eq("unit_id", user.id),
    adminClient
      .from("expenses")
      .select("monto")
      .eq("unit_id", user.id)
      .eq("estado", "aprobado"),
    adminClient
      .from("loan_visits")
      .select("loan_id")
      .eq("unit_id", user.id)
      .eq("fecha", today)
      .eq("tipo", "no_pago"),
    adminClient
      .from("capital_movements")
      .select("tipo, monto")
      .eq("unit_id", user.id)
  ]);

  const capitalInicial = Number(unit?.capital_inicial ?? 0);
  const payments = (todayPayments ?? []) as { loan_id: string; monto: number }[];
  const visits = (todayVisits ?? []) as { loan_id: string }[];
  const loans = (activeLoans ?? []) as { id: string; saldo: number }[];

  const paidIds = new Set(payments.map((p) => p.loan_id));
  const noPayIds = new Set(visits.map((v) => v.loan_id));
  const visitedIds = new Set([...paidIds, ...noPayIds]);

  const cobradoHoy = payments.reduce((s, p) => s + Number(p.monto), 0);
  const prestadoHoy = (todayLoans ?? []).reduce((s, l) => s + Number(l.valor_neto), 0);
  const gastosAprobadosHoy = (todayExpenses ?? [])
    .filter((e) => e.estado === "aprobado")
    .reduce((s, e) => s + Number(e.monto), 0);
  const gastosPendientesHoy = (todayExpenses ?? [])
    .filter((e) => e.estado === "pendiente")
    .reduce((s, e) => s + Number(e.monto), 0);

  const totalCobrado = (allPayments ?? []).reduce((s, p) => s + Number(p.monto), 0);
  const totalPrestado = (allLoans ?? []).reduce((s, l) => s + Number(l.valor_neto), 0);
  const totalGastosAprobados = (allExpenses ?? []).reduce((s, e) => s + Number(e.monto), 0);
  const movements = (capitalMovements ?? []) as { tipo: string; monto: number }[];
  const totalCapitalIngresos = movements.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const totalCapitalRetiros = movements.filter((m) => m.tipo === "retiro").reduce((s, m) => s + Number(m.monto), 0);
  const cajaEstimada = capitalInicial + totalCobrado - totalPrestado - totalGastosAprobados + totalCapitalIngresos - totalCapitalRetiros;

  const totalCartera = loans.reduce((s, l) => s + Number(l.saldo), 0);
  const visitadosCount = visitedIds.size;
  const pendientesCobro = loans.length - visitadosCount;

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reporte del dia</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobros del dia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <StatBlock label="Cobrado hoy" value={formatCurrency(cobradoHoy)} highlight />
          <StatBlock label="Visitados" value={`${visitadosCount} / ${loans.length}`} />
          <StatBlock label="Pendientes de cobro" value={String(pendientesCobro)} />
          <StatBlock label="Sin pago hoy" value={String(noPayIds.size)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prestamos del dia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <StatBlock label="Prestado hoy" value={formatCurrency(prestadoHoy)} />
          <StatBlock label="Cartera activa" value={formatCurrency(totalCartera)} />
          <StatBlock label="Prestamos activos" value={String(loans.length)} />
          <StatBlock label="Cuotas cobradas hoy" value={String(paidIds.size)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos del dia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <StatBlock label="Aprobados hoy" value={formatCurrency(gastosAprobadosHoy)} />
          <StatBlock label="Pendientes hoy" value={formatCurrency(gastosPendientesHoy)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caja estimada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <Row label="Capital inicial" value={formatCurrency(capitalInicial)} />
            <Row label="+ Total cobrado (historico)" value={formatCurrency(totalCobrado)} />
            <Row label="- Total prestado (historico)" value={formatCurrency(totalPrestado)} negative />
            <Row label="- Gastos aprobados" value={formatCurrency(totalGastosAprobados)} negative />
            {totalCapitalIngresos > 0 ? (
              <Row label="+ Capital inyectado" value={formatCurrency(totalCapitalIngresos)} />
            ) : null}
            {totalCapitalRetiros > 0 ? (
              <Row label="- Capital retirado" value={formatCurrency(totalCapitalRetiros)} negative />
            ) : null}
            <div className="mt-3 border-t pt-3">
              <Row
                bold
                highlight={cajaEstimada >= 0}
                label="Caja estimada"
                negative={cajaEstimada < 0}
                value={formatCurrency(cajaEstimada)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Calculado en tiempo real. No incluye movimientos de capital del admin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBlock({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold${highlight ? " text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  negative,
  highlight,
  bold
}: {
  label: string;
  value: string;
  negative?: boolean;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={bold ? "font-medium text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={[
          "font-medium",
          negative ? "text-destructive" : "",
          highlight ? "text-primary" : "",
          bold ? "text-base font-bold" : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
