import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { UnidadConfiguracionClient } from "@/components/admin/unidad-configuracion-client";

export default async function AdminUnidadConfiguracionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: unitRaw } = await adminClient
    .from("units")
    .select(
      "id, username, nombre_unidad, encargado, telefono, pais, estado, ciudad, zona_horaria, capital_inicial, activo, intereses, dias_laborales, puede_eliminar_abonos, puede_eliminar_prestamos"
    )
    .eq("id", id)
    .maybeSingle();

  if (!unitRaw) notFound();

  const unit = {
    id: unitRaw.id,
    username: unitRaw.username,
    nombre_unidad: unitRaw.nombre_unidad,
    encargado: unitRaw.encargado,
    telefono: unitRaw.telefono ?? null,
    pais: unitRaw.pais ?? "",
    estado: unitRaw.estado ?? "",
    ciudad: unitRaw.ciudad ?? "",
    zona_horaria: unitRaw.zona_horaria ?? "America/Bogota",
    capital_inicial: Number(unitRaw.capital_inicial),
    activo: unitRaw.activo,
    intereses: Array.isArray(unitRaw.intereses) ? (unitRaw.intereses as number[]) : [],
    dias_laborales: Array.isArray(unitRaw.dias_laborales)
      ? (unitRaw.dias_laborales as number[])
      : [],
    puede_eliminar_abonos: unitRaw.puede_eliminar_abonos ?? false,
    puede_eliminar_prestamos: unitRaw.puede_eliminar_prestamos ?? false
  };

  return <UnidadConfiguracionClient unit={unit} />;
}
