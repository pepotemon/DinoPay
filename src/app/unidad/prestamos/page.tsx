import { redirect } from "next/navigation";
import { PrestamosClient } from "@/components/unidad/prestamos-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RawLoanRow = {
  id: string;
  client_id: string;
  valor_cuota: number;
  valor_neto: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  modalidad: string;
  posicion: number | null;
  clients:
    | {
        alias: string;
        nit: string | null;
        direccion1: string | null;
        direccion2: string | null;
        barrio: string | null;
        telefono1: string | null;
        telefono2: string | null;
      }
    | {
        alias: string;
        nit: string | null;
        direccion1: string | null;
        direccion2: string | null;
        barrio: string | null;
        telefono1: string | null;
        telefono2: string | null;
      }[]
    | null;
};

type PaymentHistoryRow = {
  id: string;
  loan_id: string;
  monto: number;
  numero_cuotas: number;
  metodo_pago: string;
  fecha_pago: string;
  hora_registro: string;
};

type LoanHistoryRow = {
  id: string;
  client_id: string;
  valor_neto: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  estado: string;
  fecha_inicio: string | null;
  created_at: string;
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
        "id, client_id, valor_cuota, valor_neto, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, modalidad, posicion, clients(alias, nit, direccion1, direccion2, barrio, telefono1, telefono2)"
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
  const loanIds = loans.map((loan) => loan.id);
  const clientIds = [...new Set(loans.map((loan) => loan.client_id))];

  const [{ data: paymentHistory }, { data: loanHistory }] = await Promise.all([
    loanIds.length > 0
      ? adminClient
          .from("payments")
          .select("id, loan_id, monto, numero_cuotas, metodo_pago, fecha_pago, hora_registro")
          .in("loan_id", loanIds)
          .eq("unit_id", user.id)
          .eq("eliminado", false)
          .order("fecha_pago", { ascending: false })
          .order("hora_registro", { ascending: false })
      : { data: [] },
    clientIds.length > 0
      ? adminClient
          .from("loans")
          .select(
            "id, client_id, valor_neto, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, estado, fecha_inicio, created_at"
          )
          .eq("unit_id", user.id)
          .in("client_id", clientIds)
          .order("created_at", { ascending: false })
      : { data: [] }
  ]);

  const paymentHistoryByLoan = ((paymentHistory ?? []) as PaymentHistoryRow[]).reduce<
    Record<string, PaymentHistoryRow[]>
  >((acc, payment) => {
    acc[payment.loan_id] = [...(acc[payment.loan_id] ?? []), payment];
    return acc;
  }, {});

  const loanHistoryByClient = ((loanHistory ?? []) as LoanHistoryRow[]).reduce<
    Record<string, LoanHistoryRow[]>
  >((acc, loan) => {
    acc[loan.client_id] = [...(acc[loan.client_id] ?? []), loan];
    return acc;
  }, {});

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
      loanHistoryByClient={loanHistoryByClient}
      paymentHistoryByLoan={paymentHistoryByLoan}
      paidLoanIds={paidLoanIds}
      totalSaldo={totalSaldo}
    />
  );
}
