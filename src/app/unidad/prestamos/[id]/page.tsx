import { ArrowLeft, MapPin, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deletePaymentAction } from "@/lib/actions/unidad/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";

type ClientInfo = {
  id: string;
  alias: string;
  nit: string | null;
  barrio: string | null;
  direccion1: string | null;
  direccion2: string | null;
  telefono1: string | null;
  telefono2: string | null;
};

type LoanDetailRow = {
  id: string;
  client_id: string;
  modalidad: string;
  interes: number;
  valor_neto: number;
  valor_cuota: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  posicion: number | null;
  estado: string;
  clients: ClientInfo | ClientInfo[] | null;
};

type PaymentRow = {
  id: string;
  monto: number;
  numero_cuotas: number;
  metodo_pago: string;
  fecha_pago: string;
  hora_registro: string;
};

type VisitRow = {
  id: string;
  fecha: string;
  nota: string | null;
};

type PastLoanRow = {
  id: string;
  modalidad: string;
  valor_neto: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  estado: string;
  fecha_inicio: string | null;
};

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function whatsappHref(phone: string, alias: string) {
  const message = encodeURIComponent(`Hola ${alias}, te escribo de DinoPay sobre tu prestamo.`);
  return `https://wa.me/${digitsOnly(phone)}?text=${message}`;
}

function clientQuality(cuotasPagadas: number, noPayCount: number) {
  const total = cuotasPagadas + noPayCount;
  if (total === 0) return null;
  const ratio = cuotasPagadas / total;
  if (ratio >= 0.8) return { label: "Bueno", className: "bg-green-100 text-green-800" };
  if (ratio >= 0.5) return { label: "Regular", className: "bg-amber-100 text-amber-800" };
  return { label: "Riesgoso", className: "bg-red-100 text-red-800" };
}

export default async function PrestamoDetallePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const [{ data: loan }, { data: payments }, { data: visits }] = await Promise.all([
    adminClient
      .from("loans")
      .select(
        "id, client_id, modalidad, interes, valor_neto, valor_cuota, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, posicion, estado, clients(id, alias, nit, barrio, direccion1, direccion2, telefono1, telefono2)"
      )
      .eq("id", id)
      .eq("unit_id", user.id)
      .maybeSingle(),
    adminClient
      .from("payments")
      .select("id, monto, numero_cuotas, metodo_pago, fecha_pago, hora_registro")
      .eq("loan_id", id)
      .eq("unit_id", user.id)
      .eq("eliminado", false)
      .order("fecha_pago", { ascending: false })
      .order("hora_registro", { ascending: false }),
    adminClient
      .from("loan_visits")
      .select("id, fecha, nota")
      .eq("loan_id", id)
      .eq("unit_id", user.id)
      .eq("tipo", "no_pago")
      .order("fecha", { ascending: false })
  ]);

  if (!loan) notFound();

  const loanRow = loan as unknown as LoanDetailRow;
  const client = Array.isArray(loanRow.clients)
    ? loanRow.clients[0] ?? null
    : loanRow.clients;
  const paymentRows = (payments ?? []) as PaymentRow[];
  const visitRows = (visits ?? []) as VisitRow[];

  // Fetch: historial de préstamos anteriores + quality data
  const clientId = loanRow.client_id;
  const [{ data: pastLoans }, { data: allVisits }, { data: allLoansForClient }] =
    await Promise.all([
      adminClient
        .from("loans")
        .select("id, modalidad, valor_neto, numero_cuotas, cuotas_pagadas, estado, fecha_inicio")
        .eq("client_id", clientId)
        .eq("unit_id", user.id)
        .neq("estado", "activo")
        .order("fecha_inicio", { ascending: false }),
      adminClient
        .from("loan_visits")
        .select("id")
        .eq("unit_id", user.id)
        .eq("tipo", "no_pago")
        .in(
          "loan_id",
          // We need all loan ids for this client — use a subquery approach via separate query
          [id]
        ),
      adminClient
        .from("loans")
        .select("id, cuotas_pagadas")
        .eq("client_id", clientId)
        .eq("unit_id", user.id)
    ]);

  // Compute quality across all loans of this client
  const allClientLoanIds = (allLoansForClient ?? []).map((l) => l.id);
  const totalCuotasPagadas = (allLoansForClient ?? []).reduce(
    (s, l) => s + Number(l.cuotas_pagadas),
    0
  );

  // Fetch no-pay visits for ALL loans of this client
  const { data: allNoPayVisits } = allClientLoanIds.length
    ? await adminClient
        .from("loan_visits")
        .select("id")
        .eq("unit_id", user.id)
        .eq("tipo", "no_pago")
        .in("loan_id", allClientLoanIds)
    : { data: [] };

  const totalNoPayVisits = (allNoPayVisits ?? []).length;
  const quality = clientQuality(totalCuotasPagadas, totalNoPayVisits);

  const phone = client?.telefono1 || client?.telefono2 || "";
  const hasPhone = digitsOnly(phone).length > 0;
  const address = [client?.direccion1, client?.direccion2, client?.barrio]
    .filter(Boolean)
    .join(", ");
  const paidPercentage =
    Number(loanRow.total_a_cobrar) > 0
      ? Math.min(
          Math.round(
            ((Number(loanRow.total_a_cobrar) - Number(loanRow.saldo)) /
              Number(loanRow.total_a_cobrar)) *
              100
          ),
          100
        )
      : 0;

  const pastLoanRows = (pastLoans ?? []) as PastLoanRow[];

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href="/unidad/prestamos">
          <ArrowLeft className="h-4 w-4" />
          Prestamos
        </Link>
      </Button>

      <section className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Posicion {loanRow.posicion ?? "-"}</p>
          {quality ? (
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", quality.className)}>
              {quality.label}
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold">{client?.alias ?? "Cliente sin nombre"}</h1>
        <p className="text-sm text-muted-foreground">
          Cuota {loanRow.cuotas_pagadas}/{loanRow.numero_cuotas} - {loanRow.modalidad}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(Number(loanRow.saldo))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cuota</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(Number(loanRow.valor_cuota))}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{paidPercentage}% pagado</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Prestamo" value={formatCurrency(Number(loanRow.valor_neto))} />
            <Info label="Total" value={formatCurrency(Number(loanRow.total_a_cobrar))} />
            <Info label="Interes" value={`${Number(loanRow.interes)}%`} />
            <Info label="Estado" value={loanRow.estado} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contacto</CardTitle>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/unidad/prestamos/${id}/editar-cliente`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            {client?.nit ? <Info label="NIT" value={client.nit} /> : null}
            {client?.telefono1 ? <Info label="Telefono 1" value={client.telefono1} /> : null}
            {client?.telefono2 ? <Info label="Telefono 2" value={client.telefono2} /> : null}
            {address ? <Info label="Direccion" value={address} /> : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button asChild disabled={!hasPhone} variant="secondary">
              <a href={hasPhone ? `tel:${digitsOnly(phone)}` : undefined}>
                <Phone className="h-4 w-4" />
                Llamar
              </a>
            </Button>
            <Button asChild disabled={!hasPhone}>
              <a
                href={hasPhone ? whatsappHref(phone, client?.alias ?? "cliente") : undefined}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          {address ? (
            <Button asChild className="w-full" variant="secondary">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                rel="noreferrer"
                target="_blank"
              >
                <MapPin className="h-4 w-4" />
                Abrir direccion
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentRows.map((payment) => (
            <div
              className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-sm"
              key={payment.id}
            >
              <div>
                <p className="font-medium">{payment.fecha_pago}</p>
                <p className="text-muted-foreground">
                  {payment.numero_cuotas} cuota(s) - {payment.metodo_pago}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{formatCurrency(Number(payment.monto))}</p>
                <form action={deletePaymentAction}>
                  <input name="paymentId" type="hidden" value={payment.id} />
                  <input name="loanId" type="hidden" value={id} />
                  <button
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    title="Anular pago"
                    type="submit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ))}
          {paymentRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este prestamo todavia no tiene pagos registrados.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {visitRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Visitas sin pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visitRows.map((visit) => (
              <div className="rounded-md border bg-muted/30 p-3 text-sm" key={visit.id}>
                <p className="font-medium">{visit.fecha}</p>
                {visit.nota ? <p className="text-muted-foreground">{visit.nota}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {pastLoanRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Prestamos anteriores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pastLoanRows.map((pl) => (
              <div
                className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-sm"
                key={pl.id}
              >
                <div>
                  <p className="font-medium capitalize">{pl.modalidad}</p>
                  <p className="text-muted-foreground">
                    {pl.fecha_inicio ?? "—"} · {pl.cuotas_pagadas}/{pl.numero_cuotas} cuotas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(Number(pl.valor_neto))}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      pl.estado === "completado"
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {pl.estado}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
