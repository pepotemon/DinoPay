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

async function CajaContent() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();

  const unitMeta = await adminClient
    .from("units")
    .select("capital_inicial, zona_horaria")
    .eq("id", user.id)
    .maybeSingle();

  const zonaHoraria = unitMeta.data?.zona_horaria ?? "America/Bogota";
  const today = todayInTimeZone(zonaHoraria);
  const since180Str = addDaysToDateString(today, -180);

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
      .select("loan_id, monto, fecha_pago, hora_registro")
      .eq("unit_id", user.id)
      .eq("eliminado", false),
    adminClient
      .from("loans")
      .select("valor_neto, created_at")
      .eq("unit_id", user.id),
    adminClient
      .from("expenses")
      .select("monto, fecha")
      .eq("unit_id", user.id)
      .eq("estado", "aprobado"),
    adminClient
      .from("capital_movements")
      .select("tipo, monto, created_at")
      .eq("unit_id", user.id),
    adminClient
      .from("loans")
      .select("id")
      .eq("unit_id", user.id)
      .eq("estado", "activo"),
    adminClient
      .from("loan_visits")
      .select("loan_id, fecha, created_at")
      .eq("unit_id", user.id)
      .eq("tipo", "no_pago")
      .gte("fecha", since180Str)
  ]);

  const data: CajaData = {
    today,
    capitalInicial: Number(unitMeta.data?.capital_inicial ?? 0),
    payments: ((rawPayments ?? []) as { loan_id: string; monto: number; fecha_pago: string; hora_registro: string }[]).map((p) => ({
      loan_id: p.loan_id,
      monto: Number(p.monto),
      fecha_pago: dateInTimeZone(p.hora_registro, zonaHoraria)
    })),
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
    visits: ((rawVisits ?? []) as { loan_id: string; fecha: string; created_at: string }[]).map((v) => ({
      loan_id: v.loan_id,
      fecha: dateInTimeZone(v.created_at, zonaHoraria)
    }))
  };

  return <CajaDelDiaClient data={data} />;
}
