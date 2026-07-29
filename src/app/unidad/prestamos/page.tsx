import { redirect } from "next/navigation";
import { PrestamosClient } from "@/components/unidad/prestamos-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calcularCuotasAdelantadas, calcularDiasAtraso } from "@/lib/utils/overdue";
import { getUnitMeta } from "@/lib/data/unit";
import { getHolidayDates } from "@/lib/data/holidays";
import { addDaysToDateString, dateInTimeZone, todayInTimeZone } from "@/lib/utils/date-timezone";

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
  interes: number;
  posicion: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ultima_cuota_fecha: string | null;
  created_at: string;
  clients:
    | {
        alias: string;
        nit: string | null;
        direccion1: string | null;
        direccion2: string | null;
        barrio: string | null;
        telefono1: string | null;
        telefono2: string | null;
        genero: string | null;
      }
    | {
        alias: string;
        nit: string | null;
        direccion1: string | null;
        direccion2: string | null;
        barrio: string | null;
        telefono1: string | null;
        telefono2: string | null;
        genero: string | null;
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
  valor_cuota: number;
  interes: number;
  modalidad: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
};

export default async function PrestamosPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const unit = await getUnitMeta(user.id);
  const zonaHoraria: string = unit?.zona_horaria ?? "America/Bogota";
  const today = todayInTimeZone(zonaHoraria);
  const tomorrow = addDaysToDateString(today, 1);
  const currentYear = new Date().getFullYear();

  const [{ data: rawLoans }, { data: paymentsToday }, { data: visitsToday }] =
    await Promise.all([
      adminClient
        .from("loans")
        .select(
          "id, client_id, valor_cuota, valor_neto, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, modalidad, interes, posicion, fecha_inicio, fecha_fin, ultima_cuota_fecha, created_at, clients(alias, nit, direccion1, direccion2, barrio, telefono1, telefono2, genero)"
        )
        .eq("unit_id", user.id)
        .eq("estado", "activo")
        .order("posicion", { ascending: true }),
      adminClient
        .from("payments")
        .select("loan_id, monto, hora_registro")
        .eq("unit_id", user.id)
        .in("fecha_pago", [today, tomorrow])
        .eq("eliminado", false),
      adminClient
        .from("loan_visits")
        .select("loan_id, created_at")
        .eq("unit_id", user.id)
        .in("fecha", [today, tomorrow])
        .eq("tipo", "no_pago")
    ]);

  const loans = ((rawLoans ?? []) as unknown as RawLoanRow[]).map((loan) => ({
    ...loan,
    clients: Array.isArray(loan.clients) ? (loan.clients[0] ?? null) : loan.clients
  }));
  const loanIds = loans.map((loan) => loan.id);
  const clientIds = [...new Set(loans.map((loan) => loan.client_id))];

  const countryCode: string | null = unit?.pais_codigo ?? null;
  const diasLaborales: number[] = Array.isArray(unit?.dias_laborales) ? unit.dias_laborales : [];
  const canDeletePayments = unit?.puede_eliminar_abonos === true;
  const canDeleteLoans = unit?.puede_eliminar_prestamos === true;

  const holidayDates = countryCode
    ? await getHolidayDates(countryCode, currentYear)
    : [];
  const holidaySet = new Set(holidayDates);

  const [{ data: activePaymentHistory }, { data: loanHistory }] = await Promise.all([
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
            "id, client_id, valor_neto, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, valor_cuota, interes, modalidad, estado, fecha_inicio, fecha_fin, created_at"
          )
          .eq("unit_id", user.id)
          .in("client_id", clientIds)
          .order("created_at", { ascending: false })
      : { data: [] }
  ]);

  // También traemos pagos de préstamos anteriores (completados)
  const prevLoanIds = ((loanHistory ?? []) as LoanHistoryRow[])
    .map((l) => l.id)
    .filter((id) => !loanIds.includes(id));

  const { data: prevPaymentHistory } = prevLoanIds.length > 0
    ? await adminClient
        .from("payments")
        .select("id, loan_id, monto, numero_cuotas, metodo_pago, fecha_pago, hora_registro")
        .in("loan_id", prevLoanIds)
        .eq("unit_id", user.id)
        .eq("eliminado", false)
        .order("fecha_pago", { ascending: false })
        .order("hora_registro", { ascending: false })
    : { data: [] };

  const allPayments = [
    ...((activePaymentHistory ?? []) as PaymentHistoryRow[]),
    ...((prevPaymentHistory ?? []) as PaymentHistoryRow[])
  ];

  const paymentHistoryByLoan = allPayments.reduce<Record<string, PaymentHistoryRow[]>>(
    (acc, payment) => {
      acc[payment.loan_id] = [...(acc[payment.loan_id] ?? []), payment];
      return acc;
    },
    {}
  );

  const loanHistoryByClient = ((loanHistory ?? []) as LoanHistoryRow[]).reduce<
    Record<string, LoanHistoryRow[]>
  >((acc, loan) => {
    acc[loan.client_id] = [...(acc[loan.client_id] ?? []), loan];
    return acc;
  }, {});

  const todayPayments = ((paymentsToday ?? []) as { loan_id: string; monto: number; hora_registro: string }[])
    .filter((p) => dateInTimeZone(p.hora_registro, zonaHoraria) === today);
  const todayVisits = ((visitsToday ?? []) as { loan_id: string; created_at: string }[])
    .filter((v) => dateInTimeZone(v.created_at, zonaHoraria) === today);

  const paidLoanIds = todayPayments.map((p) => p.loan_id);
  const noPayLoanIds = todayVisits.map((v) => v.loan_id);
  const cobradoHoy = todayPayments.reduce((s, p) => s + Number(p.monto), 0);
  const meta = loans.reduce((s, l) => s + Number(l.valor_cuota), 0);
  const totalSaldo = loans.reduce((s, l) => s + Number(l.saldo), 0);

  // Calcular días de atraso y cuotas adelantadas por préstamo
  const overdueByLoan = loans.reduce<Record<string, number>>((acc, loan) => {
    acc[loan.id] = calcularDiasAtraso(loan.ultima_cuota_fecha, holidaySet, today);
    return acc;
  }, {});

  const adelantadasByLoan = loans.reduce<Record<string, number>>((acc, loan) => {
    acc[loan.id] = calcularCuotasAdelantadas(
      loan.ultima_cuota_fecha,
      loan.modalidad,
      diasLaborales,
      today
    );
    return acc;
  }, {});

  return (
    <PrestamosClient
      adelantadasByLoan={adelantadasByLoan}
      cobradoHoy={cobradoHoy}
      countryCode={countryCode}
      canDeleteLoans={canDeleteLoans}
      canDeletePayments={canDeletePayments}
      loans={loans}
      loanHistoryByClient={loanHistoryByClient}
      meta={meta}
      noPayLoanIds={noPayLoanIds}
      overdueByLoan={overdueByLoan}
      paymentHistoryByLoan={paymentHistoryByLoan}
      paidLoanIds={paidLoanIds}
      totalSaldo={totalSaldo}
      today={today}
      zonaHoraria={zonaHoraria}
    />
  );
}
