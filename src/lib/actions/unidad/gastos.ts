"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createExpenseSchema = z.object({
  categoria: z.string().min(2, "Selecciona una categoria."),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero."),
  nota: z.string().optional()
});

export async function createExpenseAction(formData: FormData) {
  const parsed = createExpenseSchema.safeParse({
    categoria: formData.get("categoria"),
    monto: formData.get("monto"),
    nota: formData.get("nota")
  });

  if (!parsed.success) {
    redirect(`/unidad/gastos?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Revisa el gasto.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("id")
    .eq("id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!unit) {
    redirect("/unidad/gastos?error=Solo una unidad activa puede registrar gastos.");
  }

  const input = parsed.data;
  const { error } = await adminClient.from("expenses").insert({
    unit_id: user.id,
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
