import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInTimeZone } from "@/lib/utils/date-timezone";
import { UnidadClientesClient } from "@/components/admin/unidad-clientes-client";

type ClientRow = {
  id: string;
  alias: string;
  nit: string | null;
  telefono1: string | null;
  telefono2: string | null;
  direccion1: string | null;
  barrio: string | null;
  activo: boolean;
};

type LoanRow = {
  id: string;
  client_id: string;
  modalidad: string;
  interes: number;
  valor_neto: number;
  valor_cuota: number;
  total_a_cobrar: number;
  saldo: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  ultima_cuota_fecha: string | null;
  fecha_inicio: string | null;
  estado: "activo" | "congelado";
};

export default async function AdminUnidadClientesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const [{ data: unitRaw }, { data: clientsRaw }, { data: loansRaw }, { data: unitsRaw }] =
    await Promise.all([
      adminClient
        .from("units")
        .select("id, nombre_unidad, zona_horaria")
        .eq("id", id)
        .maybeSingle(),
      adminClient
        .from("clients")
        .select("id, alias, nit, telefono1, telefono2, direccion1, barrio, activo")
        .eq("unit_id", id)
        .order("alias", { ascending: true }),
      adminClient
        .from("loans")
        .select(
          "id, client_id, modalidad, interes, valor_neto, valor_cuota, total_a_cobrar, saldo, numero_cuotas, cuotas_pagadas, ultima_cuota_fecha, fecha_inicio, estado"
        )
        .eq("unit_id", id)
        .in("estado", ["activo", "congelado"]),
      adminClient
        .from("units")
        .select("id, nombre_unidad, activo")
        .order("nombre_unidad", { ascending: true })
    ]);

  if (!unitRaw) notFound();

  const unit = unitRaw as { id: string; nombre_unidad: string; zona_horaria: string };
  const clients = (clientsRaw ?? []) as ClientRow[];
  const loans = (loansRaw ?? []) as LoanRow[];
  const allUnits = (unitsRaw ?? []) as { id: string; nombre_unidad: string; activo: boolean }[];

  const today = todayInTimeZone(unit.zona_horaria ?? "America/Bogota");

  const loanByClient = new Map<string, LoanRow>();
  for (const loan of loans) {
    loanByClient.set(loan.client_id, loan);
  }

  const clientsWithLoans = clients.map((c) => {
    const clientLoan = loanByClient.get(c.id) ?? null;
    return {
      id: c.id,
      alias: c.alias,
      nit: c.nit,
      telefono1: c.telefono1,
      telefono2: c.telefono2,
      direccion1: c.direccion1,
      barrio: c.barrio,
      activo: c.activo,
      loan: clientLoan
        ? {
            id: clientLoan.id,
            modalidad: clientLoan.modalidad,
            interes: Number(clientLoan.interes),
            valor_neto: Number(clientLoan.valor_neto),
            valor_cuota: Number(clientLoan.valor_cuota),
            total_a_cobrar: Number(clientLoan.total_a_cobrar),
            saldo: Number(clientLoan.saldo),
            numero_cuotas: clientLoan.numero_cuotas,
            cuotas_pagadas: clientLoan.cuotas_pagadas,
            ultima_cuota_fecha: clientLoan.ultima_cuota_fecha,
            fecha_inicio: clientLoan.fecha_inicio,
            estado: clientLoan.estado
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
      units={allUnits}
    />
  );
}
