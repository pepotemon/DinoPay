import {
  CircleSlash,
  Eye,
  MessageCircle,
  Phone,
  PlusCircle,
  Search,
  SlidersHorizontal
} from "lucide-react";
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
import { cn, formatCurrency } from "@/lib/utils";

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
    telefono2: string | null;
  } | null;
};

type RawLoanRow = Omit<LoanRow, "clients"> & {
  clients:
    | {
        alias: string;
        barrio: string | null;
        telefono1: string | null;
        telefono2: string | null;
      }
    | {
        alias: string;
        barrio: string | null;
        telefono1: string | null;
        telefono2: string | null;
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

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function whatsappHref(phone: string, alias: string) {
  const message = encodeURIComponent(`Hola ${alias}, te escribo de DinoPay sobre tu prestamo.`);
  return `https://wa.me/${digitsOnly(phone)}?text=${message}`;
}

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
          "id, valor_cuota, valor_neto, saldo, cuotas_pagadas, numero_cuotas, posicion, clients(alias, barrio, telefono1, telefono2)"
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
  const paidLoanIds = new Set(todayPayments.map((p) => p.loan_id));
  const noPayLoanIds = new Set(todayVisits.map((v) => v.loan_id));
  const visitedLoanIds = new Set([...paidLoanIds, ...noPayLoanIds]);

  const cobradoHoy = todayPayments.reduce((sum, p) => sum + Number(p.monto), 0);
  const meta = activeLoans.reduce((sum, l) => sum + Number(l.valor_cuota), 0);
  const faltante = Math.max(meta - cobradoHoy, 0);
  const progreso = meta > 0 ? Math.min(Math.round((cobradoHoy / meta) * 100), 100) : 0;
  const totalSaldo = activeLoans.reduce((sum, l) => sum + Number(l.saldo), 0);
  const visitados = visitedLoanIds.size;

  const filteredLoans = activeLoans.filter((loan) => {
    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "pendientes" && !visitedLoanIds.has(loan.id)) ||
      (statusFilter === "visitados" && visitedLoanIds.has(loan.id));
    const searchable = [loan.clients?.alias, loan.clients?.barrio, loan.clients?.telefono1]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && (!query || searchable.includes(query));
  });

  function filterHref(nextStatus: string) {
    const urlParams = new URLSearchParams();
    urlParams.set("estado", nextStatus);
    if (query) urlParams.set("q", query);
    return `/unidad/prestamos?${urlParams.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prestamos de hoy</h1>
          <p className="text-sm text-muted-foreground">Ruta ordenada por posicion.</p>
        </div>
        <Button asChild>
          <Link href="/unidad/nuevo">
            <PlusCircle className="h-4 w-4" />
            Nuevo
          </Link>
        </Button>
      </div>

      {/* Totalizador */}
      <Card>
        <CardHeader>
          <CardTitle>Totalizador del dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Recaudado" value={formatCurrency(cobradoHoy)} highlight />
            <Stat label="Meta" value={formatCurrency(meta)} />
            <Stat label="Faltante" value={formatCurrency(faltante)} />
            <Stat label="Visitados" value={`${visitados}/${activeLoans.length}`} />
          </div>
          <div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${progreso}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{progreso}% completado</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Cartera total: {formatCurrency(totalSaldo)}
          </p>
        </CardContent>
      </Card>

      {paymentError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {paymentError}
        </div>
      ) : null}

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant={statusFilter === "todos" ? "default" : "secondary"}>
            <Link href={filterHref("todos")}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
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
              placeholder="Buscar cliente o barrio"
              type="search"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Lista de préstamos */}
      <div className="space-y-3 pb-8">
        {filteredLoans.map((loan) => {
          const phone = loan.clients?.telefono1 || loan.clients?.telefono2 || "";
          const hasPhone = digitsOnly(phone).length > 0;
          const isPaid = paidLoanIds.has(loan.id);
          const isNoPay = noPayLoanIds.has(loan.id) && !isPaid;
          const isVisited = visitedLoanIds.has(loan.id);

          return (
            <Card
              className={cn(
                "overflow-hidden border-l-4",
                isPaid && "border-l-green-500",
                isNoPay && "border-l-orange-400",
                !isVisited && "border-l-transparent"
              )}
              key={loan.id}
            >
              <CardContent className="space-y-3 p-4">
                {/* Nombre + estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">
                      {loan.clients?.alias ?? "Cliente sin nombre"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{loan.posicion ?? "-"}
                      {loan.clients?.barrio ? ` · ${loan.clients.barrio}` : ""}
                      {" · "}
                      Cuota {loan.cuotas_pagadas + 1}/{loan.numero_cuotas}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isPaid ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Cobrado
                      </span>
                    ) : isNoPay ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                        Sin pago
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Cuota + saldo */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cuota</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(Number(loan.valor_cuota))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-sm font-medium">{formatCurrency(Number(loan.saldo))}</p>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-1.5">
                  <Button asChild className="flex-1" size="sm" variant="secondary">
                    <Link href={`/unidad/prestamos/${loan.id}`}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-10 shrink-0 px-0"
                    disabled={!hasPhone}
                    size="sm"
                    variant="secondary"
                  >
                    <a href={hasPhone ? `tel:${digitsOnly(phone)}` : undefined}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    className="w-10 shrink-0 px-0"
                    disabled={!hasPhone}
                    size="sm"
                    variant="secondary"
                  >
                    <a
                      href={
                        hasPhone
                          ? whatsappHref(phone, loan.clients?.alias ?? "cliente")
                          : undefined
                      }
                      rel="noreferrer"
                      target="_blank"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                {/* Zona de cobro */}
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  {!isVisited ? (
                    <form action={markNoPayVisitAction}>
                      <input name="loanId" type="hidden" value={loan.id} />
                      <Button className="w-full" size="sm" type="submit" variant="secondary">
                        <CircleSlash className="h-3.5 w-3.5" />
                        Sin pago hoy
                      </Button>
                    </form>
                  ) : null}

                  {isPaid ? (
                    <p className="py-1 text-center text-xs font-medium text-green-700">
                      ✓ Pago del dia registrado
                    </p>
                  ) : null}

                  <form action={registerPaymentFormAction} className="space-y-2">
                    <input name="loanId" type="hidden" value={loan.id} />
                    <PaymentInputs
                      maxCuotas={Math.max(loan.numero_cuotas - loan.cuotas_pagadas, 1)}
                      valorCuota={Number(loan.valor_cuota)}
                    />
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}

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

function Stat({
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
      <p className={cn("text-xl font-semibold", highlight && "text-primary")}>{value}</p>
    </div>
  );
}
