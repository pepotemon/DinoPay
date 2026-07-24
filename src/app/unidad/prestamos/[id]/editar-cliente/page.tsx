import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditClientForm } from "@/components/unidad/edit-client-form";
import { Button } from "@/components/ui/button";
import { updateClientAction } from "@/lib/actions/unidad/clients";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function EditarClientePage({
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
  const { data: loan } = await adminClient
    .from("loans")
    .select(
      "id, client_id, clients(id, alias, nit, direccion1, direccion2, barrio, telefono1, telefono2)"
    )
    .eq("id", id)
    .eq("unit_id", user.id)
    .maybeSingle();

  if (!loan) notFound();

  const rawClient = Array.isArray(loan.clients) ? loan.clients[0] : loan.clients;
  if (!rawClient) notFound();

  const clientData = rawClient as {
    id: string;
    alias: string;
    nit: string | null;
    direccion1: string | null;
    direccion2: string | null;
    barrio: string | null;
    telefono1: string | null;
    telefono2: string | null;
  };

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href={`/unidad/prestamos/${id}`}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
        <p className="text-sm text-muted-foreground">{clientData.alias}</p>
      </div>

      <EditClientForm
        defaults={{
          clientId: clientData.id,
          loanId: id,
          alias: clientData.alias,
          nit: clientData.nit,
          direccion1: clientData.direccion1,
          direccion2: clientData.direccion2,
          barrio: clientData.barrio,
          telefono1: clientData.telefono1,
          telefono2: clientData.telefono2
        }}
        updateClient={updateClientAction}
      />
    </div>
  );
}
