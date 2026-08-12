import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatCurrency } from "@/lib/utils";

type LoanRow = {
  id: string;
  modalidad: string;
  interes: number;
  valor_neto: number;
  total_a_cobrar: number;
  valor_cuota: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  saldo: number;
  estado: string;
  fecha_inicio: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  loan_id: string;
};

const ESTADO_COLORS: Record<string, string> = {
  activo: "bg-green-100 text-green-800",
  completado: "bg-blue-100 text-blue-800",
  cancelado: "bg-muted text-muted-foreground"
};

const ESTADO_LABELS: Record<string, string> = {
  activo: "Activo",
  completado: "Completado",
  cancelado: "Cancelado"
};

export default async function AdminClientHistoryPage({
  params
}: {
  params: Promise<{ id: string; clientId: string }>;
}) {
  const { id, clientId } = await params;
  const adminClient = createAdminClient();

  const [{ data: client }, { data: loansRaw }, { data: paymentsRaw }] =
    await Promise.all([
      adminClient
        .from("clients")
        .select("id, alias, nit, telefono1, telefono2, activo")
        .eq("id", clientId)
        .eq("unit_id", id)
        .maybeSingle(),
      adminClient
        .from("loans")
        .select(
          "id, modalidad, interes, valor_neto, total_a_cobrar, valor_cuota, numero_cuotas, cuotas_pagadas, saldo, estado, fecha_inicio, created_at"
        )
        .eq("client_id", clientId)
        .eq("unit_id", id)
        .order("created_at", { ascending: false }),
      adminClient
        .from("payments")
        .select("id, monto, metodo_pago, fecha_pago, loan_id")
        .eq("unit_id", id)
        .eq("eliminado", false)
        .order("fecha_pago", { ascending: false })
        .limit(50)
    ]);

  if (!client) notFound();

  const loans = (loansRaw ?? []) as LoanRow[];
  const payments = (paymentsRaw ?? []) as PaymentRow[];

  const mostRecentLoan = loans[0] ?? null;
  const recentPayments = mostRecentLoan
    ? payments.filter((p) => p.loan_id === mostRecentLoan.id)
    : [];

  return (
    <div className="space-y-5 pb-8">
      <Link
        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
        href={`/admin/unidades/${id}`}
      >
        ← Unidad
      </Link>

      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <h1 className="text-2xl font-bold uppercase">{client.alias}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
          {client.nit ? <span>NIT: {client.nit}</span> : null}
          {client.telefono1 ? <span>{client.telefono1}</span> : null}
          {client.telefono2 ? <span>{client.telefono2}</span> : null}
        </div>
        <span
          className={cn(
            "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            client.activo
              ? "bg-green-100 text-green-800"
              : "bg-muted text-muted-foreground"
          )}
        >
          {client.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="space-y-3">
        <p className="font-semibold">
          Préstamos ({loans.length})
        </p>
        {loans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin préstamos.</p>
        ) : (
          loans.map((loan) => (
            <div
              className="rounded-2xl border bg-background p-4 shadow-sm space-y-3"
              key={loan.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium capitalize">
                    {loan.modalidad} · {loan.interes}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {loan.fecha_inicio ?? loan.created_at.slice(0, 10)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    ESTADO_COLORS[loan.estado] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {ESTADO_LABELS[loan.estado] ?? loan.estado}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Prestado</p>
                  <p className="font-semibold">{formatCurrency(Number(loan.valor_neto))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="font-semibold">{formatCurrency(Number(loan.saldo))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cuotas</p>
                  <p className="font-semibold">
                    {loan.cuotas_pagadas}/{loan.numero_cuotas}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {mostRecentLoan ? (
        <div className="space-y-3">
          <p className="font-semibold">Pagos del préstamo más reciente</p>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div
                  className="flex items-center justify-between rounded-xl border bg-muted/20 p-3 text-sm"
                  key={p.id}
                >
                  <div>
                    <p className="font-medium">{p.fecha_pago}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {p.metodo_pago}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatCurrency(Number(p.monto))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
