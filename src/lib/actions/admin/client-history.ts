"use server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getClientPaymentsAction(loanId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("payments")
    .select("id, monto, fecha_pago, hora_registro, tipo_pago")
    .eq("loan_id", loanId)
    .eq("eliminado", false)
    .order("fecha_pago", { ascending: false })
    .order("hora_registro", { ascending: false })
    .limit(50);
  return (data ?? []) as {
    id: string;
    monto: number;
    fecha_pago: string;
    hora_registro: string;
    tipo_pago: string | null;
  }[];
}

export async function getClientLoansAction(clientId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("loans")
    .select(
      "id, modalidad, interes, valor_neto, valor_cuota, saldo, numero_cuotas, cuotas_pagadas, estado, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as {
    id: string;
    modalidad: string;
    interes: number;
    valor_neto: number;
    valor_cuota: number;
    saldo: number;
    numero_cuotas: number;
    cuotas_pagadas: number;
    estado: string;
    created_at: string;
  }[];
}
