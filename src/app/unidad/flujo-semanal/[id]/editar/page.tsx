import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditAjusteForm } from "@/components/unidad/edit-ajuste-form";
import { Button } from "@/components/ui/button";
import { updateAjusteAction } from "@/lib/actions/unidad/ajustes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function EditarAjustePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ semana?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const semanaInicio = sp?.semana ?? "";

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: ajuste } = await adminClient
    .from("weekly_adjustments")
    .select("id, tipo, monto, descripcion, fecha, semana_inicio")
    .eq("id", id)
    .eq("unit_id", user.id)
    .maybeSingle();

  if (!ajuste) notFound();

  const row = ajuste as {
    id: string;
    tipo: "ingreso" | "egreso";
    monto: number;
    descripcion: string | null;
    fecha: string;
    semana_inicio: string;
  };

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href={`/unidad/flujo-semanal?semana=${row.semana_inicio}`}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Editar ajuste</h1>

      <EditAjusteForm
        defaults={{
          ajusteId: row.id,
          semanaInicio: row.semana_inicio,
          tipo: row.tipo,
          monto: Number(row.monto),
          descripcion: row.descripcion,
          fecha: row.fecha
        }}
        updateAjuste={updateAjusteAction}
      />
    </div>
  );
}
