"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UpdateClientState = {
  ok: boolean;
  message: string;
};

const updateClientSchema = z.object({
  clientId: z.string().uuid(),
  loanId: z.string().uuid(),
  alias: z.string().min(2, "El alias del cliente es obligatorio."),
  nit: z.string().optional(),
  direccion1: z.string().optional(),
  direccion2: z.string().optional(),
  barrio: z.string().optional(),
  telefono1: z.string().optional(),
  telefono2: z.string().optional()
});

export async function updateClientAction(
  _prev: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const parsed = updateClientSchema.safeParse({
    clientId: formData.get("clientId"),
    loanId: formData.get("loanId"),
    alias: formData.get("alias"),
    nit: formData.get("nit"),
    direccion1: formData.get("direccion1"),
    direccion2: formData.get("direccion2"),
    barrio: formData.get("barrio"),
    telefono1: formData.get("telefono1"),
    telefono2: formData.get("telefono2")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tu sesion expiro. Inicia sesion de nuevo." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("clients")
    .update({
      alias: parsed.data.alias,
      nit: parsed.data.nit ?? "",
      direccion1: parsed.data.direccion1 ?? "",
      direccion2: parsed.data.direccion2 ?? "",
      barrio: parsed.data.barrio ?? "",
      telefono1: parsed.data.telefono1 ?? "",
      telefono2: parsed.data.telefono2 ?? ""
    })
    .eq("id", parsed.data.clientId)
    .eq("unit_id", user.id);

  if (error) return { ok: false, message: error.message };

  redirect(`/unidad/prestamos/${parsed.data.loanId}`);
}

const updateDisponibleClientSchema = z.object({
  clientId: z.string().uuid(),
  alias: z.string().min(2, "El alias del cliente es obligatorio."),
  nit: z.string().optional(),
  direccion1: z.string().optional(),
  direccion2: z.string().optional(),
  barrio: z.string().optional(),
  telefono1: z.string().optional(),
  telefono2: z.string().optional()
});

export async function updateDisponibleClientAction(
  _prev: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const parsed = updateDisponibleClientSchema.safeParse({
    clientId: formData.get("clientId"),
    alias: formData.get("alias"),
    nit: formData.get("nit"),
    direccion1: formData.get("direccion1"),
    direccion2: formData.get("direccion2"),
    barrio: formData.get("barrio"),
    telefono1: formData.get("telefono1"),
    telefono2: formData.get("telefono2")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tu sesion expiro. Inicia sesion de nuevo." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("clients")
    .update({
      alias: parsed.data.alias,
      nit: parsed.data.nit ?? "",
      direccion1: parsed.data.direccion1 ?? "",
      direccion2: parsed.data.direccion2 ?? "",
      barrio: parsed.data.barrio ?? "",
      telefono1: parsed.data.telefono1 ?? "",
      telefono2: parsed.data.telefono2 ?? ""
    })
    .eq("id", parsed.data.clientId)
    .eq("unit_id", user.id);

  if (error) return { ok: false, message: error.message };

  redirect("/unidad/disponibles");
}
