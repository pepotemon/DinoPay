import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CajaDelDiaClient, type CajaData } from "@/components/unidad/caja-client";
import { PageSpinner } from "@/components/ui/page-spinner";

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

  const since180 = new Date();
  since180.setDate(since180.getDate() - 180);
  const since180Str = since180.toISOString().slice(0, 10);

  const [
    { data: unit },
    { data: rawPayments },
    { data: rawLoans },
    { data: rawExpenses },
    { data: rawMovs },
    { data: rawActiveLoans },
    { data: rawVisits }
  ] = await Promise.all([
    adminClient.from("units").select("capital_inicial").eq("id", user.id).maybeSingle(),
    adminClient
      .from("payments")
      .select("loan_id, monto, fecha_pago")
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
      .select("loan_id, fecha")
      .eq("unit_id", user.id)
      .eq("tipo", "no_pago")
      .gte("fecha", since180Str)
  ]);

  const data: CajaData = {
    capitalInicial: Number(unit?.capital_inicial ?? 0),
    payments: (rawPayments ?? []) as CajaData["payments"],
    loansCreated: ((rawLoans ?? []) as { valor_neto: number; created_at: string }[]).map((l) => ({
      valor_neto: Number(l.valor_neto),
      fecha: l.created_at.slice(0, 10)
    })),
    expensesApproved: ((rawExpenses ?? []) as { monto: number; fecha: string }[]).map((e) => ({
      monto: Number(e.monto),
      fecha: e.fecha
    })),
    capitalMovs: ((rawMovs ?? []) as { tipo: string; monto: number; created_at: string }[]).map(
      (m) => ({
        tipo: m.tipo,
        monto: Number(m.monto),
        fecha: m.created_at.slice(0, 10)
      })
    ),
    activeLoansCount: (rawActiveLoans ?? []).length,
    visits: (rawVisits ?? []) as CajaData["visits"]
  };

  return <CajaDelDiaClient data={data} />;
}
