import { redirect } from "next/navigation";
import { PrestamosClient } from "@/components/unidad/prestamos-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RawLoanRow = {
  id: string;
  valor_cuota: number;
  valor_neto: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  modalidad: string;
  posicion: number | null;
  clients:
    | { alias: string; barrio: string | null; telefono1: string | null; telefono2: string | null }
    | { alias: string; barrio: string | null; telefono1: string | null; telefono2: string | null }[]
    | null;
};

export default async function PrestamosPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rawLoans }, { data: paymentsToday }, { data: visitsToday }] = await Promise.all([
    adminClient
      .from("loans")
      .select(
        "id, valor_cuota, valor_neto, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, modalidad, posicion, clients(alias, barrio, telefono1, telefono2)"
      )
      .eq("unit_id", user.id)
      .eq("estado", "activo")
      .order("posicion", { ascending: true }),
    adminClient
      .from("payments")
      .select("loan_id, monto")
      .eq("unit_id", user.id)
      .eq("fecha_pago", today)
      .eq("eliminado", false),
    adminClient
      .from("loan_visits")
      .select("loan_id")
      .eq("unit_id", user.id)
      .eq("fecha", today)
      .eq("tipo", "no_pago")
  ]);

  const loans = ((rawLoans ?? []) as unknown as RawLoanRow[]).map((loan) => ({
    ...loan,
    clients: Array.isArray(loan.clients) ? (loan.clients[0] ?? null) : loan.clients
  }));

  const todayPayments = (paymentsToday ?? []) as { loan_id: string; monto: number }[];
  const todayVisits = (visitsToday ?? []) as { loan_id: string }[];

  const paidLoanIds = todayPayments.map((p) => p.loan_id);
  const noPayLoanIds = todayVisits.map((v) => v.loan_id);
  const cobradoHoy = todayPayments.reduce((s, p) => s + Number(p.monto), 0);
  const meta = loans.reduce((s, l) => s + Number(l.valor_cuota), 0);
  const totalSaldo = loans.reduce((s, l) => s + Number(l.saldo), 0);

  return (
    <PrestamosClient
      cobradoHoy={cobradoHoy}
      loans={loans}
      meta={meta}
      noPayLoanIds={noPayLoanIds}
      paidLoanIds={paidLoanIds}
      totalSaldo={totalSaldo}
    />
  );
}
