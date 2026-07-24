import { ArrowLeft, ArrowRight, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NuevoAjusteForm } from "@/components/unidad/nuevo-ajuste-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAjusteAction, deleteAjusteAction } from "@/lib/actions/unidad/ajustes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";

function getWeekStart(dateStr?: string): string {
  const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(startStr: string): string {
  const start = new Date(`${startStr}T12:00:00`);
  const end = new Date(`${startStr}T12:00:00`);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("es-CO", opts)} – ${end.toLocaleDateString("es-CO", opts)}`;
}

function dayLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

export default async function FlujoSemanalPage({
  searchParams
}: {
  searchParams?: Promise<{ semana?: string; error?: string }>;
}) {
  const params = await searchParams;
  const weekStart = getWeekStart(params?.semana);
  const weekEnd = addDays(weekStart, 6);
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const today = new Date().toISOString().slice(0, 10);
  const currentWeekStart = getWeekStart();
  const isCurrentWeek = weekStart === currentWeekStart;
  const isFutureWeek = weekStart > currentWeekStart;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [
    { data: rawPayments },
    { data: rawLoans },
    { data: rawExpenses },
    { data: rawAdjustments }
  ] = await Promise.all([
    adminClient
      .from("payments")
      .select("monto, metodo_pago, fecha_pago")
      .eq("unit_id", user.id)
      .eq("eliminado", false)
      .gte("fecha_pago", weekStart)
      .lte("fecha_pago", weekEnd),
    adminClient
      .from("loans")
      .select("valor_neto, created_at")
      .eq("unit_id", user.id)
      .gte("created_at", `${weekStart}T00:00:00`)
      .lte("created_at", `${weekEnd}T23:59:59`),
    adminClient
      .from("expenses")
      .select("monto, fecha")
      .eq("unit_id", user.id)
      .eq("estado", "aprobado")
      .gte("fecha", weekStart)
      .lte("fecha", weekEnd),
    adminClient
      .from("weekly_adjustments")
      .select("id, tipo, monto, descripcion, fecha")
      .eq("unit_id", user.id)
      .eq("semana_inicio", weekStart)
      .order("fecha", { ascending: false })
  ]);

  type Payment = { monto: number; metodo_pago: string; fecha_pago: string };
  type Loan = { valor_neto: number; created_at: string };
  type Expense = { monto: number; fecha: string };
  type Adjustment = { id: string; tipo: string; monto: number; descripcion: string | null; fecha: string };

  const payments = (rawPayments ?? []) as Payment[];
  const loans = (rawLoans ?? []) as Loan[];
  const expenses = (rawExpenses ?? []) as Expense[];
  const adjustments = (rawAdjustments ?? []) as Adjustment[];

  // Weekly totals
  const cobradoEfectivo = payments.filter((p) => p.metodo_pago === "efectivo").reduce((s, p) => s + Number(p.monto), 0);
  const cobradoTransferencia = payments.filter((p) => p.metodo_pago === "transferencia").reduce((s, p) => s + Number(p.monto), 0);
  const cobradoTotal = cobradoEfectivo + cobradoTransferencia;
  const prestadoTotal = loans.reduce((s, l) => s + Number(l.valor_neto), 0);
  const gastosTotal = expenses.reduce((s, e) => s + Number(e.monto), 0);
  const ajusteIngresos = adjustments.filter((a) => a.tipo === "ingreso").reduce((s, a) => s + Number(a.monto), 0);
  const ajusteEgresos = adjustments.filter((a) => a.tipo === "egreso").reduce((s, a) => s + Number(a.monto), 0);
  const ajusteNeto = ajusteIngresos - ajusteEgresos;
  const recaudado = cobradoTotal - prestadoTotal - gastosTotal + ajusteNeto;

  // Daily breakdown
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayData = weekDays.map((day) => {
    const dayPayments = payments.filter((p) => p.fecha_pago === day);
    const dayLoans = loans.filter((l) => l.created_at.slice(0, 10) === day);
    const dayExpenses = expenses.filter((e) => e.fecha === day);
    const cobrado = dayPayments.reduce((s, p) => s + Number(p.monto), 0);
    const prestado = dayLoans.reduce((s, l) => s + Number(l.valor_neto), 0);
    const gastos = dayExpenses.reduce((s, e) => s + Number(e.monto), 0);
    return { day, cobrado, prestado, gastos, recaudadoDia: cobrado - prestado - gastos };
  });

  const hasActivity = dayData.some((d) => d.cobrado > 0 || d.prestado > 0 || d.gastos > 0);

  return (
    <div className="space-y-5 pb-8">
      {/* Header con navegación */}
      <div className="flex items-center justify-between gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/unidad/flujo-semanal?semana=${prevWeek}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">Flujo semanal</h1>
          <p className="text-sm text-muted-foreground">{formatWeekLabel(weekStart)}</p>
        </div>
        {!isCurrentWeek && !isFutureWeek ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/unidad/flujo-semanal?semana=${nextWeek}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {params?.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      {/* Totalizadores semanales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de la semana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5 text-sm">
            <Row label="Cobrado (efectivo)" value={formatCurrency(cobradoEfectivo)} />
            <Row label="Cobrado (transferencia)" value={formatCurrency(cobradoTransferencia)} />
            <div className="border-t pt-1.5">
              <Row bold label="Total cobrado" value={formatCurrency(cobradoTotal)} highlight />
            </div>
            <Row label="Prestado" value={formatCurrency(prestadoTotal)} negative />
            <Row label="Gastos aprobados" value={formatCurrency(gastosTotal)} negative />
            {ajusteNeto !== 0 ? (
              <Row
                label={`Ajustes (${ajusteNeto >= 0 ? "+" : "-"})`}
                value={formatCurrency(Math.abs(ajusteNeto))}
                negative={ajusteNeto < 0}
              />
            ) : null}
            <div className="border-t pt-1.5">
              <Row
                bold
                highlight={recaudado >= 0}
                label="Recaudado"
                negative={recaudado < 0}
                value={formatCurrency(recaudado)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por día */}
      {hasActivity ? (
        <Card>
          <CardHeader>
            <CardTitle>Por dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayData.map((d) => {
              const isToday = d.day === today;
              const isEmpty = d.cobrado === 0 && d.prestado === 0 && d.gastos === 0;
              if (isEmpty) return null;
              return (
                <div
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    isToday && "border-primary/40 bg-primary/5"
                  )}
                  key={d.day}
                >
                  <p className="mb-2 font-medium capitalize">{dayLabel(d.day)}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Cobrado</span>
                    <span className="text-right font-medium">{formatCurrency(d.cobrado)}</span>
                    {d.prestado > 0 ? (
                      <>
                        <span className="text-muted-foreground">Prestado</span>
                        <span className="text-right font-medium text-destructive">
                          -{formatCurrency(d.prestado)}
                        </span>
                      </>
                    ) : null}
                    {d.gastos > 0 ? (
                      <>
                        <span className="text-muted-foreground">Gastos</span>
                        <span className="text-right font-medium text-destructive">
                          -{formatCurrency(d.gastos)}
                        </span>
                      </>
                    ) : null}
                    <span className="border-t pt-1 text-muted-foreground">Recaudado</span>
                    <span
                      className={cn(
                        "border-t pt-1 text-right font-semibold",
                        d.recaudadoDia >= 0 ? "text-primary" : "text-destructive"
                      )}
                    >
                      {formatCurrency(d.recaudadoDia)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Ajustes de la semana */}
      {adjustments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ajustes de la semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {adjustments.map((adj) => (
              <div
                className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
                key={adj.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        adj.tipo === "ingreso"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {adj.tipo === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                    </span>
                    <span className="text-xs text-muted-foreground">{adj.fecha}</span>
                  </div>
                  {adj.descripcion ? (
                    <p className="mt-1 truncate text-muted-foreground">{adj.descripcion}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={cn(
                      "font-semibold",
                      adj.tipo === "ingreso" ? "text-green-700" : "text-red-700"
                    )}
                  >
                    {adj.tipo === "egreso" ? "-" : "+"}
                    {formatCurrency(Number(adj.monto))}
                  </span>
                  <Link
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    href={`/unidad/flujo-semanal/${adj.id}/editar?semana=${weekStart}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <form action={deleteAjusteAction}>
                    <input name="ajusteId" type="hidden" value={adj.id} />
                    <input name="semanaInicio" type="hidden" value={weekStart} />
                    <button
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      type="submit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Formulario nuevo ajuste */}
      <NuevoAjusteForm
        createAjuste={createAjusteAction}
        semanaInicio={weekStart}
        today={today}
      />
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
      <span className={bold ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
      <span
        className={cn(
          "font-medium",
          negative && "text-destructive",
          highlight && "text-primary",
          bold && "text-base font-bold"
        )}
      >
        {value}
      </span>
    </div>
  );
}
