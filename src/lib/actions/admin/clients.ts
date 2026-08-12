"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateClientInlineAction(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const clientId = formData.get("clientId") as string;
  const unitId = formData.get("unitId") as string;
  if (!clientId || !unitId) return { error: "Datos requeridos" };

  const alias = (formData.get("alias") as string)?.trim();
  if (!alias) return { error: "El nombre es obligatorio" };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("clients")
    .update({
      alias,
      nit: (formData.get("nit") as string)?.trim() || null,
      telefono1: (formData.get("telefono1") as string)?.trim() || null,
      telefono2: (formData.get("telefono2") as string)?.trim() || null,
      direccion1: (formData.get("direccion1") as string)?.trim() || null,
      barrio: (formData.get("barrio") as string)?.trim() || null
    })
    .eq("id", clientId)
    .eq("unit_id", unitId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/unidades/${unitId}/clientes`);
}

export async function updateClientAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const unitId = formData.get("unitId") as string;
  if (!clientId || !unitId)
    redirect(`/admin/unidades/${unitId}/clientes`);

  const alias = (formData.get("alias") as string)?.trim();
  if (!alias)
    redirect(
      `/admin/unidades/${unitId}/clientes/${clientId}/editar?error=${encodeURIComponent("El nombre es obligatorio")}`
    );

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("clients")
    .update({
      alias,
      nit: (formData.get("nit") as string)?.trim() || null,
      telefono1: (formData.get("telefono1") as string)?.trim() || null,
      telefono2: (formData.get("telefono2") as string)?.trim() || null,
      direccion1: (formData.get("direccion1") as string)?.trim() || null,
      barrio: (formData.get("barrio") as string)?.trim() || null
    })
    .eq("id", clientId)
    .eq("unit_id", unitId);

  if (error)
    redirect(
      `/admin/unidades/${unitId}/clientes/${clientId}/editar?error=${encodeURIComponent(error.message)}`
    );

  revalidatePath(`/admin/unidades/${unitId}/clientes`);
  redirect(`/admin/unidades/${unitId}/clientes`);
}

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
