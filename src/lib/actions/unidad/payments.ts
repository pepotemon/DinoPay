"use server";

import { revalidatePath } from "next/cache";
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
  await registerPaymentAction(
    {
      ok: false,
      message: ""
    },
    formData
  );
}
