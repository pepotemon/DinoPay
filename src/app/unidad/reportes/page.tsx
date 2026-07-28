import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ReportesClient,
  type ReporteLoan,
  type ReportePayment
} from "@/components/unidad/reportes-client";

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
  fecha_pago: string;
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

function getAlias(clients: { alias: string } | { alias: string }[] | null): string {
  if (!clients) return "Cliente";
  if (Array.isArray(clients)) return clients[0]?.alias ?? "Cliente";
  return clients.alias;
}

function formatHora(timestamptz: string): string {
  return new Date(timestamptz).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

export default function ReportesPage() {
  return (
    <div className="pb-6">
      <Suspense fallback={<ReportesSkeleton />}>
        <ReportesContent />
      </Suspense>
    </div>
  );
}

async function ReportesContent() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const adminClient = createAdminClient();
  const [{ data: rawLoans }, { data: rawPayments }] = await Promise.all([
    adminClient
      .from("loans")
      .select(
        "id, valor_neto, total_a_cobrar, modalidad, interes, numero_cuotas, valor_cuota, created_at, clients(alias)"
      )
      .eq("unit_id", user.id)
      .gte("created_at", `${sinceStr}T00:00:00`)
      .order("created_at", { ascending: false }),
    adminClient
      .from("payments")
      .select(
        "id, monto, numero_cuotas, metodo_pago, hora_registro, fecha_pago, loans(numero_cuotas, cuotas_pagadas, clients(alias))"
      )
      .eq("unit_id", user.id)
      .gte("fecha_pago", sinceStr)
      .eq("eliminado", false)
      .order("hora_registro", { ascending: false })
  ]);

  const loans: ReporteLoan[] = ((rawLoans ?? []) as unknown as LoanReportRow[]).map((l) => ({
    id: l.id,
    clientAlias: getAlias(l.clients),
    modalidad: l.modalidad,
    interes: l.interes,
    numero_cuotas: l.numero_cuotas,
    valor_cuota: Number(l.valor_cuota),
    valor_neto: Number(l.valor_neto),
    total_a_cobrar: Number(l.total_a_cobrar),
    hora: formatHora(l.created_at),
    fecha: l.created_at.slice(0, 10)
  }));

  const payments: ReportePayment[] = ((rawPayments ?? []) as unknown as PaymentReportRow[]).map(
    (p) => {
      const loan = Array.isArray(p.loans) ? p.loans[0] : p.loans;
      const cuotaInfo = loan
        ? `Cuota ${loan.cuotas_pagadas}/${loan.numero_cuotas}`
        : `${p.numero_cuotas} cuota(s)`;
      return {
        id: p.id,
        clientAlias: loan ? getAlias(loan.clients) : "Cliente",
        cuotaInfo,
        metodo_pago: p.metodo_pago,
        hora: formatHora(p.hora_registro),
        monto: Number(p.monto),
        fecha_pago: p.fecha_pago
      };
    }
  );

  return <ReportesClient loans={loans} payments={payments} />;
}

function ReportesSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div className="space-y-2">
          <div className="h-10 w-36 rounded-xl bg-muted" />
          <div className="h-6 w-40 rounded-lg bg-muted" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-muted" />
      </div>

      <div className="h-12 rounded-xl bg-muted" />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-7 w-24 rounded bg-muted" />
        </div>
        <div className="rounded-2xl border p-4">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-7 w-24 rounded bg-muted" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-muted" />
        <div className="h-10 flex-1 rounded-xl bg-muted" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
