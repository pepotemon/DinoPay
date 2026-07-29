import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CajaDelDiaClient, type CajaData } from "@/components/unidad/caja-client";
import { PageSpinner } from "@/components/ui/page-spinner";
import { addDaysToDateString, dateInTimeZone, todayInTimeZone } from "@/lib/utils/date-timezone";

export default function ReporteDiarioPage() {
  return (
    <div className="pb-6">
      <Suspense fallback={<PageSpinner />}>
        <CajaContent />
      </Suspense>
    </div>
  );
}

function firstDayOfPrevMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  return `${prev.y}-${String(prev.m).padStart(2, "0")}-01`;
}

async function CajaContent() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const unitMeta = await adminClient
    .from("units")
    .select("zona_horaria")
    .eq("id", user.id)
    .maybeSingle();

  const zonaHoraria = unitMeta.data?.zona_horaria ?? "America/Bogota";
  const today = todayInTimeZone(zonaHoraria);
  const snapshotDate = firstDayOfPrevMonth(today);
  // 1-day UTC buffer for created_at filters to handle timezone edge cases
  const loadsFromUtc = addDaysToDateString(snapshotDate, -1);

  // Baseline caja up to (exclusive) snapshotDate — idempotent, creates if missing
  const { data: cajaBaseRaw } = await adminClient.rpc("ensure_caja_snapshot", {
    p_unit_id: user.id,
    p_fecha_cierre: snapshotDate
  });

  const [
    { data: rawPayments },
    { data: rawLoans },
    { data: rawExpenses },
    { data: rawMovs },
    { data: rawActiveLoans },
    { data: rawVisits }
  ] = await Promise.all([
    adminClient
      .from("payments")
      .select("loan_id, monto, fecha_pago")
      .eq("unit_id", user.id)
      .eq("eliminado", false)
      .gte("fecha_pago", snapshotDate),
    adminClient
      .from("loans")
      .select("valor_neto, created_at")
      .eq("unit_id", user.id)
      .gte("created_at", loadsFromUtc),
    adminClient
      .from("expenses")
      .select("monto, fecha")
      .eq("unit_id", user.id)
      .eq("estado", "aprobado")
      .gte("fecha", snapshotDate),
    adminClient
      .from("capital_movements")
      .select("tipo, monto, created_at")
      .eq("unit_id", user.id)
      .gte("created_at", loadsFromUtc),
    adminClient
      .from("loans")
      .select("id")
      .eq("unit_id", user.id)
      .eq("estado", "activo"),
    adminClient
      .from("loan_visits")
      .select("loan_id, fecha")
      .eq("unit_id", user.id)
      .eq("tipo", "no_pago")
      .gte("fecha", snapshotDate)
  ]);

  const data: CajaData = {
    today,
    snapshotDate,
    cajaBase: Number(cajaBaseRaw ?? 0),
    payments: ((rawPayments ?? []) as { loan_id: string; monto: number; fecha_pago: string }[]).map(
      (p) => ({
        loan_id: p.loan_id,
        monto: Number(p.monto),
        fecha_pago: p.fecha_pago
      })
    ),
    loansCreated: ((rawLoans ?? []) as { valor_neto: number; created_at: string }[]).map((l) => ({
      valor_neto: Number(l.valor_neto),
      fecha: dateInTimeZone(l.created_at, zonaHoraria)
    })),
    expensesApproved: ((rawExpenses ?? []) as { monto: number; fecha: string }[]).map((e) => ({
      monto: Number(e.monto),
      fecha: e.fecha
    })),
    capitalMovs: ((rawMovs ?? []) as { tipo: string; monto: number; created_at: string }[]).map(
      (m) => ({
        tipo: m.tipo,
        monto: Number(m.monto),
        fecha: dateInTimeZone(m.created_at, zonaHoraria)
      })
    ),
    activeLoansCount: (rawActiveLoans ?? []).length,
    visits: ((rawVisits ?? []) as { loan_id: string; fecha: string }[]).map((v) => ({
      loan_id: v.loan_id,
      fecha: v.fecha
    }))
  };

  return <CajaDelDiaClient data={data} />;
}
