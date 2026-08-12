"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deactivateClientAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const unitId = formData.get("unitId") as string;
  if (!clientId || !unitId)
    redirect(`/admin/unidades/${unitId}/clientes?error=Datos inválidos`);

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("clients")
    .update({ activo: false })
    .eq("id", clientId)
    .eq("unit_id", unitId);

  if (error)
    redirect(
      `/admin/unidades/${unitId}/clientes?error=${encodeURIComponent(error.message)}`
    );

  revalidatePath(`/admin/unidades/${unitId}/clientes`);
  redirect(`/admin/unidades/${unitId}/clientes?ok=Cliente desactivado`);
}
