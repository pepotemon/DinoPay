import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type LoanReportRow = {
  id: string;
  valor_neto: number;
  total_a_cobrar: number;
  modalidad: string;
  interes: number;
  numero_cuotas: number;
  valor_cuota: number;
  created_at: string;
  clients: { alias: string } | { alias: string }[] | null;
};

type PaymentReportRow = {
  id: string;
  monto: number;
  numero_cuotas: number;
  metodo_pago: string;
  hora_registro: string;
  loans: {
    numero_cuotas: number;
    cuotas_pagadas: number;
    clients: { alias: string } | { alias: string }[] | null;
  } | {
    numero_cuotas: number;
    cuotas_pagadas: number;
    clients: { alias: string } | { alias: string }[] | null;
  }[] | null;
};

function formatHora(timestamptz: string): string {
  return new Date(timestamptz).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function formatHoraCreacion(timestamptz: string): string {
  return new Date(timestamptz).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function getAlias(clients: { alias: string } | { alias: string }[] | null): string {
  if (!clients) return "Cliente";
  if (Array.isArray(clients)) return clients[0]?.alias ?? "Cliente";
  return clients.alias;
}

export default async function ReportesPage({
  searchParams
}: {
  searchParams?: Promise<{ fecha?: string; tab?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const fecha = params?.fecha ?? today;
  const tab = params?.tab === "abonos" ? "abonos" : "prestamos";
  const pagina = Math.max(1, parseInt(params?.pagina ?? "1", 10));
  const PER_PAGE = 20;
  const offset = (pagina - 1) * PER_PAGE;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const [{ data: rawLoans }, { data: rawPayments }] = await Promise.all([
    adminClient
      .from("loans")
      .select(
        "id, valor_neto, total_a_cobrar, modalidad, interes, numero_cuotas, valor_cuota, created_at, clients(alias)"
      )
      .eq("unit_id", user.id)
      .gte("created_at", `${fecha}T00:00:00`)
      .lte("created_at", `${fecha}T23:59:59`)
      .order("created_at", { ascending: false })
      .range(offset, offset + PER_PAGE - 1),
    adminClient
      .from("payments")
      .select(
        "id, monto, numero_cuotas, metodo_pago, hora_registro, loans(numero_cuotas, cuotas_pagadas, clients(alias))"
      )
      .eq("unit_id", user.id)
      .eq("fecha_pago", fecha)
      .eq("eliminado", false)
      .order("hora_registro", { ascending: false })
      .range(offset, offset + PER_PAGE - 1)
  ]);

  const loans = (rawLoans ?? []) as unknown as LoanReportRow[];
  const payments = (rawPayments ?? []) as unknown as PaymentReportRow[];

  const totalPrestado = loans.reduce((s, l) => s + Number(l.valor_neto), 0);
  const totalAbonado = payments.reduce((s, p) => s + Number(p.monto), 0);

  const fechaLabel = new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  function tabHref(nextTab: string) {
    return `/unidad/reportes?fecha=${fecha}&tab=${nextTab}`;
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground capitalize">{fechaLabel}</p>
      </div>

      {/* Filtro de fecha */}
      <form action="/unidad/reportes" className="flex gap-2">
        <input name="tab" type="hidden" value={tab} />
        <input
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={fecha}
          max={today}
          name="fecha"
          type="date"
        />
        <button
          className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Ver
        </button>
      </form>

      {/* Totalizadores */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Prestado</p>
            <p className="mt-0.5 text-xl font-semibold">{formatCurrency(totalPrestado)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{loans.length} prestamos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Abonado</p>
            <p className="mt-0.5 text-xl font-semibold text-primary">{formatCurrency(totalAbonado)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{payments.length} abonos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Link
          className={cn(
            "flex-1 rounded-md py-2 text-center text-sm font-medium",
            tab === "prestamos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
          href={tabHref("prestamos")}
        >
          Prestamos ({loans.length})
        </Link>
        <Link
          className={cn(
            "flex-1 rounded-md py-2 text-center text-sm font-medium",
            tab === "abonos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
          href={tabHref("abonos")}
        >
          Abonos ({payments.length})
        </Link>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {tab === "prestamos" ? (
          loans.length > 0 ? (
            loans.map((loan) => (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{getAlias(loan.clients)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {loan.modalidad} · {loan.interes}% · {formatHoraCreacion(loan.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(loan.valor_neto))}</p>
                      <p className="text-xs text-muted-foreground">
                        → {formatCurrency(Number(loan.total_a_cobrar))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{loan.numero_cuotas} cuotas</span>
                    <span>Cuota: {formatCurrency(Number(loan.valor_cuota))}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No se crearon prestamos el {fecha}.
              </CardContent>
            </Card>
          )
        ) : payments.length > 0 ? (
          payments.map((payment) => {
            const loan = Array.isArray(payment.loans) ? payment.loans[0] : payment.loans;
            const clientAlias = loan ? getAlias(loan.clients) : "Cliente";
            const cuotaInfo = loan
              ? `Cuota ${loan.cuotas_pagadas}/${loan.numero_cuotas}`
              : `${payment.numero_cuotas} cuota(s)`;
            return (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{clientAlias}</p>
                      <p className="text-xs text-muted-foreground">
                        {cuotaInfo} · {payment.metodo_pago} · {formatHora(payment.hora_registro)}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {formatCurrency(Number(payment.monto))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No se registraron abonos el {fecha}.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paginación */}
      {(loans.length === PER_PAGE || payments.length === PER_PAGE || pagina > 1) ? (
        <div className="flex gap-2 pb-8">
          {pagina > 1 ? (
            <Link
              className="flex-1 rounded-md bg-muted py-2 text-center text-sm font-medium"
              href={`/unidad/reportes?fecha=${fecha}&tab=${tab}&pagina=${pagina - 1}`}
            >
              ← Anterior
            </Link>
          ) : null}
          {(tab === "prestamos" ? loans : payments).length === PER_PAGE ? (
            <Link
              className="flex-1 rounded-md bg-muted py-2 text-center text-sm font-medium"
              href={`/unidad/reportes?fecha=${fecha}&tab=${tab}&pagina=${pagina + 1}`}
            >
              Siguiente →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
