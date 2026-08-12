"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const decideExpenseSchema = z.object({
  expenseId: z.string().uuid(),
  decision: z.enum(["aprobado", "rechazado"])
});

export async function decideExpenseAction(formData: FormData) {
  const parsed = decideExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    decision: formData.get("decision")
  });

  if (!parsed.success) {
    redirect("/admin/gastos?error=Gasto invalido");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: admin, error: adminError } = await adminClient
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/admin/gastos?error=Solo un administrador puede aprobar gastos");
  }

  const { expenseId, decision } = parsed.data;
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
    redirect(`/admin/gastos?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("admin-pending-expenses");
  revalidatePath("/admin/gastos");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/gastos?ok=${decision === "aprobado" ? "Gasto aprobado" : "Gasto rechazado"}`);
}
