"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AjusteState = {
  ok: boolean;
  message: string;
};

const ajusteSchema = z.object({
  semanaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["ingreso", "egreso"]),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero."),
  descripcion: z.string().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function createAjusteAction(
  _prev: AjusteState,
  formData: FormData
): Promise<AjusteState> {
  const parsed = ajusteSchema.safeParse({
    semanaInicio: formData.get("semanaInicio"),
    tipo: formData.get("tipo"),
    monto: formData.get("monto"),
    descripcion: formData.get("descripcion"),
    fecha: formData.get("fecha")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tu sesion expiro." };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("weekly_adjustments").insert({
    unit_id: user.id,
    tipo: parsed.data.tipo,
    monto: parsed.data.monto,
    descripcion: parsed.data.descripcion?.trim() || null,
    fecha: parsed.data.fecha,
    semana_inicio: parsed.data.semanaInicio
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/unidad/flujo-semanal");
  redirect("/unidad/flujo-semanal");
}

export type UpdateAjusteState = {
  ok: boolean;
  message: string;
};

const updateAjusteSchema = z.object({
  ajusteId: z.string().uuid(),
  semanaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["ingreso", "egreso"]),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero."),
  descripcion: z.string().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function updateAjusteAction(
  _prev: UpdateAjusteState,
  formData: FormData
): Promise<UpdateAjusteState> {
  const parsed = updateAjusteSchema.safeParse({
    ajusteId: formData.get("ajusteId"),
    semanaInicio: formData.get("semanaInicio"),
    tipo: formData.get("tipo"),
    monto: formData.get("monto"),
    descripcion: formData.get("descripcion"),
    fecha: formData.get("fecha")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tu sesion expiro." };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("weekly_adjustments")
    .update({
      tipo: parsed.data.tipo,
      monto: parsed.data.monto,
      descripcion: parsed.data.descripcion?.trim() || null,
      fecha: parsed.data.fecha
    })
    .eq("id", parsed.data.ajusteId)
    .eq("unit_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/unidad/flujo-semanal");
  redirect(`/unidad/flujo-semanal?semana=${parsed.data.semanaInicio}&ok=Ajuste actualizado`);
}

export async function deleteAjusteAction(formData: FormData) {
  const ajusteId = formData.get("ajusteId");
  const semanaInicio = formData.get("semanaInicio");

  if (!ajusteId || typeof ajusteId !== "string") {
    redirect("/unidad/flujo-semanal?error=ID invalido.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  await adminClient
    .from("weekly_adjustments")
    .delete()
    .eq("id", ajusteId)
    .eq("unit_id", user.id);

  revalidatePath("/unidad/flujo-semanal");
  redirect(`/unidad/flujo-semanal?semana=${semanaInicio ?? ""}`);
}
