"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RegisterPaymentState = {
  ok: boolean;
  message: string;
};

const registerPaymentSchema = z.object({
  loanId: z.string().uuid(),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero."),
  numeroCuotas: z.coerce.number().int().min(1),
  metodoPago: z.enum(["efectivo", "transferencia"])
});

const noPayVisitSchema = z.object({
  loanId: z.string().uuid(),
  nota: z.string().min(2, "Selecciona una razon.")
});

export async function registerPaymentAction(
  _previousState: RegisterPaymentState,
  formData: FormData
): Promise<RegisterPaymentState> {
  const parsed = registerPaymentSchema.safeParse({
    loanId: formData.get("loanId"),
    monto: formData.get("monto"),
    numeroCuotas: formData.get("numeroCuotas"),
    metodoPago: formData.get("metodoPago")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Revisa los datos del pago."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Tu sesion expiro. Inicia sesion de nuevo."
    };
  }

  const input = parsed.data;
  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("register_payment", {
    p_loan_id: input.loanId,
    p_unit_id: user.id,
    p_monto: input.monto,
    p_numero_cuotas: input.numeroCuotas,
    p_metodo_pago: input.metodoPago
  });

  if (error) {
    return {
      ok: false,
      message: error.message
    };
  }

  revalidatePath("/unidad/prestamos");

  return {
    ok: true,
    message: "Pago registrado."
  };
}

export async function registerPaymentFormAction(formData: FormData) {
  const result = await registerPaymentAction(
    {
      ok: false,
      message: ""
    },
    formData
  );

  if (!result.ok) {
    redirect(`/unidad/prestamos?payment_error=${encodeURIComponent(result.message)}`);
  }

  redirect("/unidad/prestamos");
}

export async function deletePaymentAction(formData: FormData) {
  const paymentId = formData.get("paymentId");
  const loanId = formData.get("loanId");

  if (!paymentId || typeof paymentId !== "string") {
    redirect("/unidad/prestamos?payment_error=ID de pago invalido.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("reverse_payment", {
    p_payment_id: paymentId,
    p_unit_id: user.id
  });

  if (error) {
    const dest = loanId ? `/unidad/prestamos/${loanId}` : "/unidad/prestamos";
    redirect(`${dest}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/unidad/prestamos");
  if (loanId && typeof loanId === "string") {
    redirect(`/unidad/prestamos/${loanId}?ok=Pago anulado`);
  }
  redirect("/unidad/prestamos");
}

export async function deletePaymentResult(
  paymentId: string
): Promise<{ ok: boolean; message: string }> {
  const parsed = z.string().uuid().safeParse(paymentId);
  if (!parsed.success) return { ok: false, message: "ID de pago invalido." };

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Sesion expirada." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("reverse_payment", {
    p_payment_id: parsed.data,
    p_unit_id: user.id
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/unidad/prestamos");
  revalidatePath("/unidad/reporte-diario");
  revalidatePath("/unidad/reportes");
  revalidatePath("/unidad/flujo-semanal");

  return { ok: true, message: "Abono eliminado." };
}

export async function deleteLoanResult(
  loanId: string
): Promise<{ ok: boolean; message: string }> {
  const parsed = z.string().uuid().safeParse(loanId);
  if (!parsed.success) return { ok: false, message: "ID de prestamo invalido." };

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Sesion expirada." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("delete_loan_same_day", {
    p_loan_id: parsed.data,
    p_unit_id: user.id
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/unidad/prestamos");
  revalidatePath("/unidad/disponibles");
  revalidatePath("/unidad/reporte-diario");
  revalidatePath("/unidad/reportes");
  revalidatePath("/unidad/flujo-semanal");

  return { ok: true, message: "Prestamo eliminado." };
}

export async function markNoPayVisitAction(formData: FormData) {
  const parsed = noPayVisitSchema.safeParse({
    loanId: formData.get("loanId"),
    nota: formData.get("nota") ?? "Sin motivo"
  });

  if (!parsed.success) {
    redirect("/unidad/prestamos?payment_error=Prestamo invalido");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("mark_no_pay_visit", {
    p_loan_id: parsed.data.loanId,
    p_unit_id: user.id,
    p_nota: parsed.data.nota
  });

  if (error) {
    redirect(`/unidad/prestamos?payment_error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/unidad/prestamos");
  redirect("/unidad/prestamos");
}

export async function markNoPayVisitResult(
  loanId: string,
  nota: string
): Promise<{ ok: boolean; message: string }> {
  const parsed = noPayVisitSchema.safeParse({ loanId, nota });
  if (!parsed.success) return { ok: false, message: "Préstamo inválido." };

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesión expirada." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("mark_no_pay_visit", {
    p_loan_id: parsed.data.loanId,
    p_unit_id: user.id,
    p_nota: parsed.data.nota
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/unidad/prestamos");
  return { ok: true, message: "" };
}
