"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const decideExpenseFromHubSchema = z.object({
  expenseId: z.string().uuid(),
  unitId: z.string().uuid(),
  decision: z.enum(["aprobado", "rechazado"])
});

export async function decideExpenseFromHubAction(formData: FormData) {
  const parsed = decideExpenseFromHubSchema.safeParse({
    expenseId: formData.get("expenseId"),
    unitId: formData.get("unitId"),
    decision: formData.get("decision")
  });

  if (!parsed.success) {
    const unitId = formData.get("unitId") as string;
    redirect(`/admin/unidades/${unitId}?error=Datos invalidos`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: admin } = await adminClient
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    redirect(
      `/admin/unidades/${parsed.data.unitId}?error=${encodeURIComponent("Solo un administrador puede aprobar gastos")}`
    );
  }

  const { expenseId, unitId, decision } = parsed.data;
  const { error } = await adminClient
    .from("expenses")
    .update({
      estado: decision,
      aprobado_por: user.id,
      aprobado_at: new Date().toISOString()
    })
    .eq("id", expenseId)
    .eq("estado", "pendiente");

  if (error) {
    redirect(
      `/admin/unidades/${unitId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/unidades/${unitId}`);
  redirect(
    `/admin/unidades/${unitId}?ok=${decision === "aprobado" ? "Gasto aprobado" : "Gasto rechazado"}`
  );
}

const changePasswordSchema = z.object({
  unitId: z.string().uuid(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirm: z.string()
});

export async function changeUnitPasswordAction(formData: FormData) {
  const parsed = changePasswordSchema.safeParse({
    unitId: formData.get("unitId"),
    password: formData.get("password"),
    confirm: formData.get("confirm")
  });

  if (!parsed.success) {
    const unitId = formData.get("unitId") as string;
    redirect(
      `/admin/unidades/${unitId}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos invalidos")}`
    );
  }

  const { unitId, password, confirm } = parsed.data;

  if (password !== confirm) {
    redirect(
      `/admin/unidades/${unitId}?error=${encodeURIComponent("Las contraseñas no coinciden")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(unitId, {
    password
  });

  if (error) {
    redirect(
      `/admin/unidades/${unitId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/unidades/${unitId}`);
  redirect(`/admin/unidades/${unitId}?ok=Contraseña actualizada`);
}

const cancelLoanFromHubSchema = z.object({
  loanId: z.string().uuid(),
  unitId: z.string().uuid()
});

export async function cancelLoanFromHubAction(formData: FormData) {
  const parsed = cancelLoanFromHubSchema.safeParse({
    loanId: formData.get("loanId"),
    unitId: formData.get("unitId")
  });

  if (!parsed.success) {
    const unitId = formData.get("unitId") as string;
    redirect(
      `/admin/unidades/${unitId}?error=${encodeURIComponent("Datos invalidos")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: admin } = await adminClient
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    redirect(
      `/admin/unidades/${parsed.data.unitId}?error=${encodeURIComponent("Solo un administrador puede cancelar prestamos")}`
    );
  }

  const { loanId, unitId } = parsed.data;
  const { error } = await adminClient
    .from("loans")
    .update({ estado: "cancelado" })
    .eq("id", loanId)
    .eq("unit_id", unitId)
    .eq("estado", "activo");

  if (error) {
    redirect(
      `/admin/unidades/${unitId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/unidades/${unitId}`);
  redirect(`/admin/unidades/${unitId}?ok=${encodeURIComponent("Préstamo cancelado")}`);
}
