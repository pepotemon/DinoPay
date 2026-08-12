"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/date-timezone";

const capitalSchema = z.object({
  unitId: z.string().uuid(),
  tipo: z.enum(["ingreso", "retiro"]),
  monto: z.coerce.number().positive("El monto debe ser mayor a cero."),
  nota: z.string().optional(),
  redirectTo: z.string().optional()
});

export async function createCapitalMovementAction(formData: FormData) {
  const parsed = capitalSchema.safeParse({
    unitId: formData.get("unitId"),
    tipo: formData.get("tipo"),
    monto: formData.get("monto"),
    nota: formData.get("nota"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    const unitId = formData.get("unitId") as string;
    const redirectTo = (formData.get("redirectTo") as string) || `/admin/unidades/${unitId}`;
    redirect(
      `${redirectTo}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Revisa los datos.")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("zona_horaria")
    .eq("id", parsed.data.unitId)
    .maybeSingle();
  const today = todayInTimeZone(unit?.zona_horaria ?? "America/Bogota");

  const { error } = await adminClient.from("capital_movements").insert({
    unit_id: parsed.data.unitId,
    admin_id: user.id,
    tipo: parsed.data.tipo,
    monto: parsed.data.monto,
    nota: parsed.data.nota?.trim() || null,
    fecha: today
  });

  const successRedirect =
    parsed.data.redirectTo ?? `/admin/unidades/${parsed.data.unitId}`;

  if (error) {
    redirect(
      `${successRedirect}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/unidades/${parsed.data.unitId}`);
  revalidatePath(`/admin/unidades/${parsed.data.unitId}/transacciones`);
  redirect(`${successRedirect}?ok=Movimiento registrado`);
}
