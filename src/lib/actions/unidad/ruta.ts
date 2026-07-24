"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const routeSchema = z.object({
  loanIds: z.array(z.string().uuid()).min(1)
});

export async function updateRouteAction(formData: FormData) {
  const parsed = routeSchema.safeParse({
    loanIds: formData.getAll("loanIds")
  });

  if (!parsed.success) {
    redirect("/unidad/enrutar?error=Ruta invalida");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("update_route_positions", {
    p_unit_id: user.id,
    p_loan_ids: parsed.data.loanIds
  });

  if (error) {
    redirect(`/unidad/enrutar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/unidad/enrutar");
  revalidatePath("/unidad/prestamos");
  redirect("/unidad/enrutar?ok=Ruta guardada");
}
