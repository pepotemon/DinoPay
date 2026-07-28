import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateDisponibleClientAction } from "@/lib/actions/unidad/clients";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EditDisponibleClientForm } from "@/components/unidad/edit-disponible-client-form";

export default async function EditarClienteDisponiblePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: client } = await adminClient
    .from("clients")
    .select("id, alias, nit, direccion1, direccion2, barrio, telefono1, telefono2")
    .eq("id", id)
    .eq("unit_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!client) notFound();

  return (
    <div className="pb-6">
      <div className="px-1 pb-4 pt-2">
        <Link
          href="/unidad/disponibles"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Disponibles
        </Link>
      </div>

      <div className="px-1 pb-6">
        <h1 className="text-4xl font-black leading-tight">{client.alias}</h1>
        <p className="text-lg font-bold text-primary">Editar cliente</p>
      </div>

      <EditDisponibleClientForm
        action={updateDisponibleClientAction}
        defaults={{
          clientId: client.id,
          alias: client.alias,
          nit: client.nit,
          direccion1: client.direccion1,
          direccion2: client.direccion2,
          barrio: client.barrio,
          telefono1: client.telefono1,
          telefono2: client.telefono2
        }}
      />
    </div>
  );
}
