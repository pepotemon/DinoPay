import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createCapitalMovementAction } from "@/lib/actions/admin/capital";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatCurrency } from "@/lib/utils";
import { addDaysToDateString, dateInTimeZone, todayInTimeZone } from "@/lib/utils/date-timezone";

type CapitalRow = {
  id: string;
  tipo: "ingreso" | "retiro";
  monto: number;
  nota: string | null;
  fecha: string;
};

export default async function AdminUnidadDetallePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select(
      "id, username, nombre_unidad, encargado, telefono, ciudad, estado, capital_inicial, activo, intereses, zona_horaria, puede_eliminar_abonos, puede_eliminar_prestamos"
    )
    .eq("id", id)
    .maybeSingle();

  if (!unit) notFound();

  const zonaHoraria = unit.zona_horaria ?? "America/Bogota";
  const today = todayInTimeZone(zonaHoraria);
  const tomorrow = addDaysToDateString(today, 1);

  const [
    { data: activeLoans },
    { data: allPayments },
    { data: allLoans },
    { data: allExpenses },
    { data: capitalMovements },
    { data: todayPayments }
  ] = await Promise.all([
    adminClient
      .from("loans")
      .select("id, saldo, valor_cuota")
      .eq("unit_id", id)
      .eq("estado", "activo"),
    adminClient.from("payments").select("monto").eq("unit_id", id).eq("eliminado", false),
    adminClient.from("loans").select("valor_neto").eq("unit_id", id),
    adminClient.from("expenses").select("monto").eq("unit_id", id).eq("estado", "aprobado"),
    adminClient
      .from("capital_movements")
      .select("id, tipo, monto, nota, fecha")
      .eq("unit_id", id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    adminClient
      .from("payments")
      .select("monto, hora_registro")
      .eq("unit_id", id)
      .in("fecha_pago", [today, tomorrow])
      .eq("eliminado", false)
  ]);

  const capitalInicial = Number(unit.capital_inicial);
  const totalCobrado = (allPayments ?? []).reduce((s, p) => s + Number(p.monto), 0);
  const totalPrestado = (allLoans ?? []).reduce((s, l) => s + Number(l.valor_neto), 0);
  const totalGastos = (allExpenses ?? []).reduce((s, e) => s + Number(e.monto), 0);
  const movements = (capitalMovements ?? []) as CapitalRow[];
  const totalIngresos = movements.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const totalRetiros = movements.filter((m) => m.tipo === "retiro").reduce((s, m) => s + Number(m.monto), 0);
  const cajaEstimada = capitalInicial + totalCobrado - totalPrestado - totalGastos + totalIngresos - totalRetiros;

  const loans = activeLoans ?? [];
  const carteraTotal = loans.reduce((s, l) => s + Number(l.saldo), 0);
  const metaDia = loans.reduce((s, l) => s + Number(l.valor_cuota), 0);
  const cobradoHoy = ((todayPayments ?? []) as { monto: number; hora_registro: string }[])
    .filter((p) => dateInTimeZone(p.hora_registro, zonaHoraria) === today)
    .reduce((s, p) => s + Number(p.monto), 0);
  const intereses = Array.isArray(unit.intereses) ? (unit.intereses as number[]) : [];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link href="/admin/unidades">
            <ArrowLeft className="h-4 w-4" />
            Unidades
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/admin/unidades/${id}/editar`}>
            <Settings className="h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {sp?.ok ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {sp.ok}
        </div>
      ) : null}
      {sp?.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {sp.error}
        </div>
      ) : null}

      {/* Info de la unidad */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{unit.nombre_unidad}</h1>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              unit.activo ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
            )}
          >
            {unit.activo ? "Activa" : "Inactiva"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          @{unit.username} · {unit.encargado} · {unit.ciudad}
        </p>
        {unit.telefono ? (
          <p className="text-sm text-muted-foreground">{unit.telefono}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Intereses habilitados: {intereses.join("%, ")}%
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
            Abonos: {unit.puede_eliminar_abonos ? "puede eliminar hoy" : "sin permiso"}
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
            Prestamos: {unit.puede_eliminar_prestamos ? "puede eliminar hoy" : "sin permiso"}
          </span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Caja estimada</p>
            <p className={cn("mt-0.5 text-xl font-bold", cajaEstimada >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(cajaEstimada)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cartera activa</p>
            <p className="mt-0.5 text-xl font-semibold">{formatCurrency(carteraTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cobrado hoy</p>
            <p className="mt-0.5 text-xl font-semibold text-primary">{formatCurrency(cobradoHoy)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Meta del día</p>
            <p className="mt-0.5 text-xl font-semibold">{formatCurrency(metaDia)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos de capital */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos de capital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Capital inicial</p>
              <p className="font-semibold">{formatCurrency(capitalInicial)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inyectado</p>
              <p className="font-semibold text-primary">{formatCurrency(totalIngresos)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Retirado</p>
              <p className="font-semibold text-destructive">{formatCurrency(totalRetiros)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {movements.map((m) => (
              <div
                className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-sm"
                key={m.id}
              >
                <div className="flex items-center gap-2">
                  {m.tipo === "ingreso" ? (
                    <ArrowUpCircle className="h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{m.tipo}</p>
                    {m.nota ? <p className="text-xs text-muted-foreground">{m.nota}</p> : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-semibold", m.tipo === "ingreso" ? "text-green-700" : "text-red-600")}>
                    {m.tipo === "retiro" ? "-" : "+"}{formatCurrency(Number(m.monto))}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.fecha}</p>
                </div>
              </div>
            ))}
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
            ) : null}
          </div>

          {/* Formulario nuevo movimiento */}
          <form action={createCapitalMovementAction} className="space-y-3 border-t pt-4">
            <input name="unitId" type="hidden" value={id} />
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
                <Input inputMode="decimal" min="0.01" name="monto" placeholder="0" required step="0.01" type="number" />
              </label>
            </div>
            <label className="block space-y-1 text-xs font-medium">
              <span>Nota</span>
              <Input name="nota" placeholder="Opcional" />
            </label>
            <Button className="w-full" type="submit">
              Registrar movimiento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
