import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const _fetchUnitMeta = unstable_cache(
  async (unitId: string) => {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("units")
      .select(
        "pais_codigo, pais, dias_laborales, zona_horaria, nombre_unidad, encargado, intereses, username"
      )
      .eq("id", unitId)
      .maybeSingle();
    return data;
  },
  ["unit-meta"],
  { revalidate: 300 }
);

export const getUnitMeta = (unitId: string) => _fetchUnitMeta(unitId);
