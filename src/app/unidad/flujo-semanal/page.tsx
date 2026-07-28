import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  FlujoSemanalClient,
  type FlujoData
} from "@/components/unidad/flujo-client";
import { PageSpinner } from "@/components/ui/page-spinner";

export default function FlujoSemanalPage() {
  return (
    <div className="pb-6">
      <Suspense fallback={<PageSpinner />}>
        <FlujoContent />
      </Suspense>
    </div>
  );
}

async function FlujoContent() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().slice(0, 10);

  const adminClient = createAdminClient();
  const [{ data: rawPayments }, { data: rawLoans }, { data: rawExpenses }, { data: rawAjustes }] =
    await Promise.all([
      adminClient
        .from("payments")
        .select("monto, metodo_pago, fecha_pago")
        .eq("unit_id", user.id)
        .eq("eliminado", false)
        .gte("fecha_pago", sinceStr),
      adminClient
        .from("loans")
        .select("valor_neto, created_at")
        .eq("unit_id", user.id)
        .gte("created_at", `${sinceStr}T00:00:00`),
      adminClient
        .from("expenses")
        .select("monto, fecha")
        .eq("unit_id", user.id)
        .eq("estado", "aprobado")
        .gte("fecha", sinceStr),
      adminClient
        .from("weekly_adjustments")
        .select("id, tipo, monto, descripcion, fecha")
        .eq("unit_id", user.id)
        .gte("fecha", sinceStr)
        .order("fecha", { ascending: false })
    ]);

  const data: FlujoData = {
    payments: (rawPayments ?? []) as FlujoData["payments"],
    loans: ((rawLoans ?? []) as { valor_neto: number; created_at: string }[]).map((l) => ({
      valor_neto: Number(l.valor_neto),
      fecha: l.created_at.slice(0, 10)
    })),
    expenses: (rawExpenses ?? []) as FlujoData["expenses"],
    ajustes: (rawAjustes ?? []) as FlujoData["ajustes"]
  };

  return <FlujoSemanalClient data={data} />;
}
