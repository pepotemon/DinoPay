"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Inline config actions (return data, no redirect)
// ---------------------------------------------------------------------------

export async function updateUnitInfoInlineAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const unitId = formData.get("unitId") as string;
  if (!unitId) return { error: "ID de unidad requerido" };

  const nombre_unidad = (formData.get("nombreUnidad") as string)?.trim();
  const encargado = (formData.get("encargado") as string)?.trim();
  const ciudad = (formData.get("ciudad") as string)?.trim();
  const pais = (formData.get("pais") as string)?.trim();

  if (!nombre_unidad || !encargado || !ciudad || !pais)
    return { error: "Nombre, encargado, ciudad y país son obligatorios" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("units")
    .update({
      nombre_unidad,
      encargado,
      telefono: (formData.get("telefono") as string)?.trim() || null,
      pais,
      estado: (formData.get("estado") as string)?.trim() || "",
      ciudad,
      zona_horaria: (formData.get("zonaHoraria") as string)?.trim() || "America/Bogota"
    })
    .eq("id", unitId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/unidades/${unitId}/configuracion`);
}

export async function updateUnitOperativeInlineAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const unitId = formData.get("unitId") as string;
  if (!unitId) return { error: "ID de unidad requerido" };

  const interesesStr = (formData.get("intereses") as string) ?? "";
  const intereses = interesesStr
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  const diasStr = formData.getAll("diasLaborales") as string[];
  const dias_laborales = diasStr.map(Number);

  const puede_eliminar_abonos = formData.get("puedeEliminarAbonos") === "on";
  const puede_eliminar_prestamos = formData.get("puedeEliminarPrestamos") === "on";

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("units")
    .update({ intereses, dias_laborales, puede_eliminar_abonos, puede_eliminar_prestamos })
    .eq("id", unitId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/unidades/${unitId}/configuracion`);
}

export async function changeUnitPasswordInlineAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const unitId = formData.get("unitId") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!unitId || !password) return { error: "Datos requeridos" };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres" };
  if (password !== confirm) return { error: "Las contraseñas no coinciden" };

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(unitId, { password });

  if (error) return { error: error.message };
}

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

  revalidateTag(`admin-unit-hub-${unitId}`);
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

  revalidateTag(`admin-unit-hub-${unitId}`);
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

  revalidateTag(`admin-unit-hub-${unitId}`);
  revalidatePath(`/admin/unidades/${unitId}`);
  redirect(`/admin/unidades/${unitId}?ok=${encodeURIComponent("Préstamo cancelado")}`);
}
