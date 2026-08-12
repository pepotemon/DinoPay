import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { UnitHubClient } from "@/components/admin/unit-hub-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDaysToDateString, dateInTimeZone, todayInTimeZone } from "@/lib/utils/date-timezone";

type AdminClientWithLoan = {
  id: string;
  alias: string;
  nit: string | null;
  telefono1: string | null;
  activo: boolean;
  loan: {
    id: string;
    modalidad: string;
    interes: number;
    valor_neto: number;
    valor_cuota: number;
    saldo: number;
    numero_cuotas: number;
    cuotas_pagadas: number;
    ultima_cuota_fecha: string | null;
    estado: string;
  } | null;
};

async function fetchHubData(id: string) {
  const adminClient = createAdminClient();

  const [
    { data: unitRaw },
    { data: rawClients },
    { data: rawActiveLoans },
    { data: allPaymentsRaw },
    { data: allLoansRaw },
    { data: allExpensesRaw },
    { data: rawCapitalMovements },
    { data: allCapMovRaw },
    { data: pendingExpensesRaw },
    { data: recentExpensesRaw }
  ] = await Promise.all([
    adminClient
      .from("units")
      .select(
        "id, username, nombre_unidad, encargado, telefono, pais, estado, ciudad, zona_horaria, capital_inicial, activo, intereses, dias_laborales, puede_eliminar_abonos, puede_eliminar_prestamos"
      )
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
        "id, client_id, modalidad, interes, valor_neto, valor_cuota, saldo, numero_cuotas, cuotas_pagadas, ultima_cuota_fecha, estado"
      )
      .eq("unit_id", id)
      .eq("estado", "activo"),
    // Aggregate queries — single column only, no unnecessary data transfer
    adminClient.from("payments").select("monto").eq("unit_id", id).eq("eliminado", false),
    adminClient.from("loans").select("valor_neto").eq("unit_id", id),
    adminClient.from("expenses").select("monto").eq("unit_id", id).eq("estado", "aprobado"),
    // Last 15 movements for the UI list
    adminClient
      .from("capital_movements")
      .select("id, tipo, monto, nota, fecha")
      .eq("unit_id", id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
    // All movements for caja calculation (separate from the limited UI list)
    adminClient.from("capital_movements").select("tipo, monto").eq("unit_id", id),
    adminClient
      .from("expenses")
      .select("id, categoria, monto, nota, estado, fecha, creado_por")
      .eq("unit_id", id)
      .eq("estado", "pendiente")
      .order("fecha", { ascending: false }),
    adminClient
      .from("expenses")
      .select("id, categoria, monto, nota, estado, fecha, creado_por")
      .eq("unit_id", id)
      .eq("estado", "aprobado")
      .order("fecha", { ascending: false })
      .limit(20)
  ]);

  return {
    unitRaw,
    rawClients,
    rawActiveLoans,
    allPaymentsRaw,
    allLoansRaw,
    allExpensesRaw,
    rawCapitalMovements,
    allCapMovRaw,
    pendingExpensesRaw,
    recentExpensesRaw
  };
}

// Cache keyed per unit, tagged so server actions can invalidate it with revalidateTag
function getCachedHubData(id: string) {
  return unstable_cache(fetchHubData, [`admin-unit-hub-${id}`], {
    revalidate: 30,
    tags: [`admin-unit-hub-${id}`]
  })(id);
}

export default async function AdminUnidadHubPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cached = await getCachedHubData(id);
  const { unitRaw: unit } = cached;

  if (!unit) notFound();

  const zonaHoraria = unit.zona_horaria ?? "America/Bogota";
  const today = todayInTimeZone(zonaHoraria);
  const tomorrow = addDaysToDateString(today, 1);

  // Today's payments are always fresh — change every few minutes during route operations
  const adminClient = createAdminClient();
  const { data: todayPaymentsRaw } = await adminClient
    .from("payments")
    .select("monto, hora_registro")
    .eq("unit_id", id)
    .in("fecha_pago", [today, tomorrow])
    .eq("eliminado", false);

  const {
    rawClients,
    rawActiveLoans,
    allPaymentsRaw,
    allLoansRaw,
    allExpensesRaw,
    rawCapitalMovements,
    allCapMovRaw,
    pendingExpensesRaw,
    recentExpensesRaw
  } = cached;

  const activeLoansMap = new Map(
    (rawActiveLoans ?? []).map((l) => [l.client_id, l])
  );

  const clients: AdminClientWithLoan[] = (rawClients ?? []).map((c) => {
    const activeLoan = activeLoansMap.get(c.id) ?? null;
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
            ultima_cuota_fecha: activeLoan.ultima_cuota_fecha,
            estado: activeLoan.estado
          }
        : null
    };
  });

  const capitalInicial = Number(unit.capital_inicial);
  const totalCobrado = (allPaymentsRaw ?? []).reduce((s, p) => s + Number(p.monto), 0);
  const totalPrestado = (allLoansRaw ?? []).reduce((s, l) => s + Number(l.valor_neto), 0);
  const totalGastos = (allExpensesRaw ?? []).reduce((s, e) => s + Number(e.monto), 0);

  const movements = (rawCapitalMovements ?? []) as {
    id: string;
    tipo: "ingreso" | "retiro";
    monto: number;
    nota: string | null;
    fecha: string;
  }[];

  // Use all capital movements for caja (not just the 15 shown in the UI list)
  const allCapMov = (allCapMovRaw ?? []) as { tipo: "ingreso" | "retiro"; monto: number }[];
  const totalIngresos = allCapMov
    .filter((m) => m.tipo === "ingreso")
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalRetiros = allCapMov
    .filter((m) => m.tipo === "retiro")
    .reduce((s, m) => s + Number(m.monto), 0);

  const cajaEstimada =
    capitalInicial + totalCobrado - totalPrestado - totalGastos + totalIngresos - totalRetiros;

  const activeLoans = rawActiveLoans ?? [];
  const carteraTotal = activeLoans.reduce((s, l) => s + Number(l.saldo), 0);
  const metaDia = activeLoans.reduce((s, l) => s + Number(l.valor_cuota), 0);

  const cobradoHoy = (
    (todayPaymentsRaw ?? []) as { monto: number; hora_registro: string }[]
  )
    .filter((p) => dateInTimeZone(p.hora_registro, zonaHoraria) === today)
    .reduce((s, p) => s + Number(p.monto), 0);

  const unitInfo = {
    id: unit.id,
    username: unit.username,
    nombre_unidad: unit.nombre_unidad,
    encargado: unit.encargado,
    telefono: unit.telefono ?? null,
    pais: unit.pais,
    estado: unit.estado,
    ciudad: unit.ciudad,
    zona_horaria: unit.zona_horaria,
    capital_inicial: capitalInicial,
    activo: unit.activo,
    intereses: Array.isArray(unit.intereses) ? (unit.intereses as number[]) : [],
    dias_laborales: Array.isArray(unit.dias_laborales)
      ? (unit.dias_laborales as number[])
      : [],
    puede_eliminar_abonos: unit.puede_eliminar_abonos,
    puede_eliminar_prestamos: unit.puede_eliminar_prestamos
  };

  return (
    <UnitHubClient
      data={{
        unit: unitInfo,
        clients,
        capitalMovements: movements,
        pendingExpenses: (pendingExpensesRaw ?? []) as {
          id: string;
          categoria: string;
          monto: number;
          nota: string | null;
          estado: "pendiente" | "aprobado" | "rechazado";
          fecha: string;
          creado_por: string;
        }[],
        recentExpenses: (recentExpensesRaw ?? []) as {
          id: string;
          categoria: string;
          monto: number;
          nota: string | null;
          estado: "pendiente" | "aprobado" | "rechazado";
          fecha: string;
          creado_por: string;
        }[],
        cajaEstimada,
        carteraTotal,
        metaDia,
        cobradoHoy,
        today
      }}
    />
  );
}
