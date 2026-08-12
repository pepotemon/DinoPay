import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInTimeZone } from "@/lib/utils/date-timezone";
import { UnidadClientesClient } from "@/components/admin/unidad-clientes-client";

type ClientRow = {
  id: string;
  alias: string;
  nit: string | null;
  telefono1: string | null;
  activo: boolean;
};

type LoanRow = {
  id: string;
  client_id: string;
  modalidad: string;
  interes: number;
  valor_neto: number;
  valor_cuota: number;
  saldo: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  ultima_cuota_fecha: string | null;
};

export default async function AdminUnidadClientesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const [{ data: unitRaw }, { data: clientsRaw }, { data: loansRaw }] =
    await Promise.all([
      adminClient
        .from("units")
        .select("id, nombre_unidad, zona_horaria")
        .eq("id", id)
        .maybeSingle(),
      adminClient
        .from("clients")
        .select("id, alias, nit, telefono1, activo")
        .eq("unit_id", id)
        .order("alias", { ascending: true }),
      adminClient
        .from("loans")
        .select(
          "id, client_id, modalidad, interes, valor_neto, valor_cuota, saldo, numero_cuotas, cuotas_pagadas, ultima_cuota_fecha"
        )
        .eq("unit_id", id)
        .eq("estado", "activo")
    ]);

  if (!unitRaw) notFound();

  const unit = unitRaw as { id: string; nombre_unidad: string; zona_horaria: string };
  const clients = (clientsRaw ?? []) as ClientRow[];
  const activeLoans = (loansRaw ?? []) as LoanRow[];

  const today = todayInTimeZone(unit.zona_horaria ?? "America/Bogota");

  const loanByClient = new Map<string, LoanRow>();
  for (const loan of activeLoans) {
    loanByClient.set(loan.client_id, loan);
  }

  const clientsWithLoans = clients.map((c) => {
    const activeLoan = loanByClient.get(c.id) ?? null;
    return {
      id: c.id,
      alias: c.alias,
      nit: c.nit,
      telefono1: c.telefono1,
      activo: c.activo,
      loan: activeLoan
        ? {
            id: activeLoan.id,
            modalidad: activeLoan.modalidad,
            interes: Number(activeLoan.interes),
            valor_neto: Number(activeLoan.valor_neto),
            valor_cuota: Number(activeLoan.valor_cuota),
            saldo: Number(activeLoan.saldo),
            numero_cuotas: activeLoan.numero_cuotas,
            cuotas_pagadas: activeLoan.cuotas_pagadas,
            ultima_cuota_fecha: activeLoan.ultima_cuota_fecha
          }
        : null
    };
  });

  return (
    <UnidadClientesClient
      clients={clientsWithLoans}
      unitId={unit.id}
      unitName={unit.nombre_unidad}
      today={today}
    />
  );
}
