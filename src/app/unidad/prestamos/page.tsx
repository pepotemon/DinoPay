import { CircleSlash, PlusCircle, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentInputs } from "@/components/unidad/payment-inputs";
import {
  markNoPayVisitAction,
  registerPaymentFormAction
} from "@/lib/actions/unidad/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type LoanRow = {
  id: string;
  valor_cuota: number;
  valor_neto: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  posicion: number | null;
  clients: {
    alias: string;
    barrio: string | null;
    telefono1: string | null;
  } | null;
};

type RawLoanRow = Omit<LoanRow, "clients"> & {
  clients:
    | {
        alias: string;
        barrio: string | null;
        telefono1: string | null;
      }
    | {
        alias: string;
        barrio: string | null;
        telefono1: string | null;
      }[]
    | null;
};

type PaymentRow = {
  loan_id: string;
  monto: number;
};

type VisitRow = {
  loan_id: string;
};

export default async function PrestamosPage({
  searchParams
}: {
  searchParams?: Promise<{
    payment_error?: string;
    estado?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const paymentError = params?.payment_error;
  const statusFilter =
    params?.estado === "pendientes" || params?.estado === "visitados"
      ? params.estado
      : "todos";
  const query = (params?.q ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: loans } = user
    ? await adminClient
        .from("loans")
        .select(
          "id, valor_cuota, valor_neto, saldo, cuotas_pagadas, numero_cuotas, posicion, clients(alias, barrio, telefono1)"
        )
        .eq("unit_id", user.id)
        .eq("estado", "activo")
        .order("posicion", { ascending: true })
    : { data: [] };
  const today = new Date().toISOString().slice(0, 10);
  const { data: paymentsToday } = user
    ? await adminClient
        .from("payments")
        .select("loan_id, monto")
        .eq("unit_id", user.id)
        .eq("fecha_pago", today)
        .eq("eliminado", false)
    : { data: [] };
  const { data: visitsToday } = user
    ? await adminClient
        .from("loan_visits")
        .select("loan_id")
        .eq("unit_id", user.id)
        .eq("fecha", today)
        .eq("tipo", "no_pago")
    : { data: [] };

  const activeLoans = ((loans ?? []) as unknown as RawLoanRow[]).map((loan) => ({
    ...loan,
    clients: Array.isArray(loan.clients) ? loan.clients[0] ?? null : loan.clients
  }));
  const todayPayments = (paymentsToday ?? []) as PaymentRow[];
  const todayVisits = (visitsToday ?? []) as VisitRow[];
  const paidLoanIds = new Set(todayPayments.map((payment) => payment.loan_id));
  const noPayLoanIds = new Set(todayVisits.map((visit) => visit.loan_id));
  const visitedLoanIds = new Set([...paidLoanIds, ...noPayLoanIds]);
  const cobradoHoy = todayPayments.reduce((sum, payment) => sum + Number(payment.monto), 0);
  const meta = activeLoans.reduce((sum, loan) => sum + Number(loan.valor_cuota), 0);
  const faltante = Math.max(meta - cobradoHoy, 0);
  const progreso = meta > 0 ? Math.min(Math.round((cobradoHoy / meta) * 100), 100) : 0;
  const totalSaldo = activeLoans.reduce((sum, loan) => sum + Number(loan.saldo), 0);
  const visitados = visitedLoanIds.size;
  const filteredLoans = activeLoans.filter((loan) => {
    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "pendientes" && !visitedLoanIds.has(loan.id)) ||
      (statusFilter === "visitados" && visitedLoanIds.has(loan.id));
    const searchable = [
      loan.clients?.alias,
      loan.clients?.barrio,
      loan.clients?.telefono1
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || searchable.includes(query);

    return matchesStatus && matchesQuery;
  });

  function filterHref(nextStatus: string) {
    const urlParams = new URLSearchParams();
    urlParams.set("estado", nextStatus);
    if (query) {
      urlParams.set("q", query);
    }
    return `/unidad/prestamos?${urlParams.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prestamos de hoy</h1>
          <p className="text-sm text-muted-foreground">
            Lista principal de trabajo, ordenada por posicion de ruta.
          </p>
        </div>
        <Button asChild>
          <Link href="/unidad/nuevo">
            <PlusCircle className="h-4 w-4" />
            Nuevo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totalizador del dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">Recaudado hoy</p>
              <p className="text-2xl font-semibold">{formatCurrency(cobradoHoy)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meta del dia</p>
              <p className="text-2xl font-semibold">{formatCurrency(meta)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faltante</p>
              <p className="text-2xl font-semibold">{formatCurrency(faltante)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visitados</p>
              <p className="text-2xl font-semibold">
                {visitados}/{activeLoans.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo total</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalSaldo)}</p>
            </div>
          </div>
          <div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{progreso}% completado</p>
          </div>
        </CardContent>
      </Card>

      {paymentError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {paymentError}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant={statusFilter === "todos" ? "default" : "secondary"}>
            <Link href={filterHref("todos")}>
              <SlidersHorizontal className="h-4 w-4" />
              Todos
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={statusFilter === "pendientes" ? "default" : "secondary"}
          >
            <Link href={filterHref("pendientes")}>Pendientes</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={statusFilter === "visitados" ? "default" : "secondary"}
          >
            <Link href={filterHref("visitados")}>Visitados</Link>
          </Button>
        </div>

        <form action="/unidad/prestamos" className="flex gap-2">
          <input name="estado" type="hidden" value={statusFilter} />
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={params?.q ?? ""}
              name="q"
              placeholder="Buscar cliente, barrio o telefono"
              type="search"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {filteredLoans.map((loan) => (
          <Card key={loan.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{loan.clients?.alias ?? "Cliente sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">
                    Posicion {loan.posicion ?? "-"} - Cuota {loan.cuotas_pagadas + 1}/
                    {loan.numero_cuotas}
                  </p>
                  {paidLoanIds.has(loan.id) ? (
                    <p className="mt-1 inline-flex rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Pago registrado hoy
                    </p>
                  ) : null}
                  {noPayLoanIds.has(loan.id) ? (
                    <p className="mt-1 inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Visitado sin pago
                    </p>
                  ) : null}
                  {loan.clients?.barrio ? (
                    <p className="text-sm text-muted-foreground">{loan.clients.barrio}</p>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                  <div>
                    <p className="text-muted-foreground">Cuota</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.valor_cuota))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prestamo</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.valor_neto))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.saldo))}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-md border bg-muted/40 p-3">
                {!visitedLoanIds.has(loan.id) ? (
                  <form action={markNoPayVisitAction}>
                    <input name="loanId" type="hidden" value={loan.id} />
                    <Button className="w-full" type="submit" variant="secondary">
                      <CircleSlash className="h-4 w-4" />
                      No pago
                    </Button>
                  </form>
                ) : null}
                <form action={registerPaymentFormAction} className="space-y-3">
                  <input name="loanId" type="hidden" value={loan.id} />
                  <PaymentInputs
                    maxCuotas={Math.max(loan.numero_cuotas - loan.cuotas_pagadas, 1)}
                    valorCuota={Number(loan.valor_cuota)}
                  />
                </form>
              </div>
            </CardContent>
          </Card>
        ))}

        {activeLoans.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Todavia no hay prestamos activos. Crea el primero desde Nuevo.
            </CardContent>
          </Card>
        ) : null}

        {activeLoans.length > 0 && filteredLoans.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay prestamos que coincidan con este filtro.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
