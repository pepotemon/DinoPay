import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInTimeZone } from "@/lib/utils/date-timezone";
import { UnidadTransaccionesClient } from "@/components/admin/unidad-transacciones-client";

function getWeekRange(today: string): { desde: string; hasta: string } {
  const date = new Date(today + "T12:00:00Z");
  const day = date.getUTCDay(); // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: fmt(monday), hasta: fmt(sunday) };
}

function getMonthRange(today: string): { desde: string; hasta: string } {
  const [year, month] = today.split("-").map(Number);
  const desde = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const hasta = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { desde, hasta };
}

function getYearRange(today: string): { desde: string; hasta: string } {
  const year = today.slice(0, 4);
  return { desde: `${year}-01-01`, hasta: `${year}-12-31` };
}

export default async function AdminUnidadTransaccionesPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const adminClient = createAdminClient();

  const { data: unitRaw } = await adminClient
    .from("units")
    .select("id, nombre_unidad, zona_horaria")
    .eq("id", id)
    .maybeSingle();

  if (!unitRaw) notFound();

  const unit = unitRaw as { id: string; nombre_unidad: string; zona_horaria: string };
  const today = todayInTimeZone(unit.zona_horaria ?? "America/Bogota");

  const modo = (typeof sp.modo === "string" ? sp.modo : "semana") as
    | "dia"
    | "semana"
    | "mes"
    | "año"
    | "custom";

  let rangoDesde: string;
  let rangoHasta: string;

  if (modo === "dia") {
    rangoDesde = today;
    rangoHasta = today;
  } else if (modo === "semana") {
    const range = getWeekRange(today);
    rangoDesde = range.desde;
    rangoHasta = range.hasta;
  } else if (modo === "mes") {
    const range = getMonthRange(today);
    rangoDesde = range.desde;
    rangoHasta = range.hasta;
  } else if (modo === "año") {
    const range = getYearRange(today);
    rangoDesde = range.desde;
    rangoHasta = range.hasta;
  } else {
    // custom
    rangoDesde =
      typeof sp.desde === "string" && sp.desde ? sp.desde : today;
    rangoHasta =
      typeof sp.hasta === "string" && sp.hasta ? sp.hasta : today;
  }

  const { data: movementsRaw } = await adminClient
    .from("capital_movements")
    .select("id, tipo, monto, nota, fecha, created_at")
    .eq("unit_id", id)
    .gte("fecha", rangoDesde)
    .lte("fecha", rangoHasta)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  type MovRow = {
    id: string;
    tipo: "ingreso" | "retiro";
    monto: number;
    nota: string | null;
    fecha: string;
  };

  const movements = (movementsRaw ?? []) as MovRow[];

  const totalIngresos = movements
    .filter((m) => m.tipo === "ingreso")
    .reduce((s, m) => s + Number(m.monto), 0);

  const totalRetiros = movements
    .filter((m) => m.tipo === "retiro")
    .reduce((s, m) => s + Number(m.monto), 0);

  const balance = totalIngresos - totalRetiros;

  return (
    <UnidadTransaccionesClient
      movements={movements}
      totalIngresos={totalIngresos}
      totalRetiros={totalRetiros}
      balance={balance}
      modo={modo}
      rangoDesde={rangoDesde}
      rangoHasta={rangoHasta}
      unitId={unit.id}
      unitName={unit.nombre_unidad}
    />
  );
}
