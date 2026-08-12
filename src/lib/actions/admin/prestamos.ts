"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function cancelLoanAction(formData: FormData) {
  const loanId = formData.get("loanId");
  const unitId = formData.get("unitId");

  if (typeof loanId !== "string" || typeof unitId !== "string") {
    redirect(`/admin/unidades/${unitId}/prestamos?error=${encodeURIComponent("Datos invalidos.")}`);
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
    redirect(`/admin/unidades/${unitId}/prestamos?error=${encodeURIComponent("Solo un administrador puede cancelar prestamos.")}`);
  }

  const { error } = await adminClient
    .from("loans")
    .update({ estado: "cancelado" })
    .eq("id", loanId)
    .eq("unit_id", unitId)
    .eq("estado", "activo");

  if (error) {
    redirect(`/admin/unidades/${unitId}/prestamos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/unidades/${unitId}`);
  revalidatePath(`/admin/unidades/${unitId}/prestamos`);
  redirect(`/admin/unidades/${unitId}/prestamos?ok=${encodeURIComponent("Prestamo cancelado.")}`);
}
