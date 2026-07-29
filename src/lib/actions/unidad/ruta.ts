"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RouteActionState = { ok: boolean; message: string };

const routeSchema = z.object({
  loanIds: z.array(z.string().uuid()).min(1)
});

export async function updateRouteAction(
  _prev: RouteActionState,
  formData: FormData
): Promise<RouteActionState> {
  const parsed = routeSchema.safeParse({
    loanIds: formData.getAll("loanIds")
  });

  if (!parsed.success) {
    return { ok: false, message: "Ruta invalida" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Sesion expirada" };

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("update_route_positions", {
    p_unit_id: user.id,
    p_loan_ids: parsed.data.loanIds
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/unidad/enrutar");
  revalidatePath("/unidad/prestamos");
  return { ok: true, message: "Ruta guardada" };
}
