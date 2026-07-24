"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const expenseSchema = z.object({
  categoria: z.string().min(2, "Selecciona una categoria."),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero."),
  nota: z.string().optional()
});

async function getActiveUnit() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  return unit ? { userId: user.id, adminClient } : null;
}

export async function createExpenseAction(formData: FormData) {
  const parsed = expenseSchema.safeParse({
    categoria: formData.get("categoria"),
    monto: formData.get("monto"),
    nota: formData.get("nota")
  });

  if (!parsed.success) {
    redirect(
      `/unidad/gastos?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Revisa el gasto.")}`
    );
  }

  const ctx = await getActiveUnit();
  if (!ctx) redirect("/login");

  const input = parsed.data;
  const { error } = await ctx.adminClient.from("expenses").insert({
    unit_id: ctx.userId,
    categoria: input.categoria,
    monto: input.monto,
    nota: input.nota?.trim() || null,
    estado: "pendiente",
    creado_por: "unidad"
  });

  if (error) {
    redirect(`/unidad/gastos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/unidad/gastos");
  redirect("/unidad/gastos?ok=Gasto registrado");
}

export async function deleteExpenseAction(formData: FormData) {
  const expenseId = formData.get("expenseId");
  if (!expenseId || typeof expenseId !== "string") {
    redirect("/unidad/gastos?error=ID de gasto invalido.");
  }

  const ctx = await getActiveUnit();
  if (!ctx) redirect("/login");

  const { error } = await ctx.adminClient
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("unit_id", ctx.userId)
    .eq("estado", "pendiente");

  if (error) {
    redirect(`/unidad/gastos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/unidad/gastos");
  redirect("/unidad/gastos?ok=Gasto eliminado");
}

export type UpdateExpenseState = {
  ok: boolean;
  message: string;
};

const updateExpenseSchema = expenseSchema.extend({
  expenseId: z.string().uuid()
});

export async function updateExpenseAction(
  _prev: UpdateExpenseState,
  formData: FormData
): Promise<UpdateExpenseState> {
  const parsed = updateExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    categoria: formData.get("categoria"),
    monto: formData.get("monto"),
    nota: formData.get("nota")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const ctx = await getActiveUnit();
  if (!ctx) return { ok: false, message: "Tu sesion expiro." };

  const { error } = await ctx.adminClient
    .from("expenses")
    .update({
      categoria: parsed.data.categoria,
      monto: parsed.data.monto,
      nota: parsed.data.nota?.trim() || null
    })
    .eq("id", parsed.data.expenseId)
    .eq("unit_id", ctx.userId)
    .eq("estado", "pendiente");

  if (error) return { ok: false, message: error.message };

  redirect("/unidad/gastos?ok=Gasto actualizado");
}
