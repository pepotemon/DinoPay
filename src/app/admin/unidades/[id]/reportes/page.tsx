import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportesClient, type ReporteLoan, type ReportePayment } from "@/components/unidad/reportes-client";
import { Button } from "@/components/ui/button";
import { addDaysToDateString, dateInTimeZone, todayInTimeZone } from "@/lib/utils/date-timezone";

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

function formatHora(timestamptz: string, timeZone: string): string {
  return new Date(timestamptz).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone
  });
}

async function ReportesContent({ unitId }: { unitId: string }) {
  const adminClient = createAdminClient();

  const { data: unitData } = await adminClient
    .from("units")
    .select("id, nombre_unidad, zona_horaria")
    .eq("id", unitId)
    .maybeSingle();

  if (!unitData) notFound();

  const zonaHoraria = unitData.zona_horaria ?? "America/Bogota";
  const today = todayInTimeZone(zonaHoraria);
  const sinceStr = addDaysToDateString(today, -30);
  const sinceQueryStr = addDaysToDateString(sinceStr, -1);

  const [{ data: rawLoans }, { data: rawPayments }] = await Promise.all([
    adminClient
      .from("loans")
      .select("id, valor_neto, total_a_cobrar, modalidad, interes, numero_cuotas, valor_cuota, created_at, clients(alias)")
      .eq("unit_id", unitId)
      .gte("created_at", `${sinceQueryStr}T00:00:00`)
      .order("created_at", { ascending: false }),
    adminClient
      .from("payments")
      .select("id, monto, numero_cuotas, metodo_pago, hora_registro, fecha_pago, loans(numero_cuotas, cuotas_pagadas, clients(alias))")
      .eq("unit_id", unitId)
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
    hora: formatHora(l.created_at, zonaHoraria),
    fecha: dateInTimeZone(l.created_at, zonaHoraria)
  })).filter((l) => l.fecha >= sinceStr);

  const payments: ReportePayment[] = ((rawPayments ?? []) as unknown as PaymentReportRow[])
    .map((p) => {
      const loan = Array.isArray(p.loans) ? p.loans[0] : p.loans;
      const cuotaInfo = loan
        ? `Cuota ${loan.cuotas_pagadas}/${loan.numero_cuotas}`
        : `${p.numero_cuotas} cuota(s)`;
      return {
        id: p.id,
        clientAlias: loan ? getAlias(loan.clients) : "Cliente",
        cuotaInfo,
        metodo_pago: p.metodo_pago,
        hora: formatHora(p.hora_registro, zonaHoraria),
        monto: Number(p.monto),
        fecha_pago: dateInTimeZone(p.hora_registro, zonaHoraria)
      };
    })
    .filter((p) => p.fecha_pago >= sinceStr);

  return <ReportesClient loans={loans} payments={payments} today={today} />;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-muted" />
        <div className="h-10 flex-1 rounded-xl bg-muted" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export default async function AdminUnidadReportesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href={`/admin/unidades/${id}`}>
          <ArrowLeft className="h-4 w-4" />
          Unidad
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 días</p>
      </div>

      <Suspense fallback={<Skeleton />}>
        <ReportesContent unitId={id} />
      </Suspense>
    </div>
  );
}
