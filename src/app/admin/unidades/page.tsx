import { Building2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { UnitsListClient } from "@/components/admin/units-list-client";

type UnitRow = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  ciudad: string;
  activo: boolean;
};

type LoanAggregate = {
  unit_id: string;
  saldo: number;
  valor_cuota: number;
  client_id: string;
};

export default async function AdminUnidadesPage() {
  const adminClient = createAdminClient();

  const [{ data: unitsRaw }, { data: activeLoansRaw }] = await Promise.all([
    adminClient
      .from("units")
      .select("id, username, nombre_unidad, encargado, ciudad, activo")
      .order("nombre_unidad", { ascending: true }),
    adminClient
      .from("loans")
      .select("unit_id, saldo, valor_cuota, client_id")
      .eq("estado", "activo")
  ]);

  const units = (unitsRaw ?? []) as UnitRow[];
  const activeLoans = (activeLoansRaw ?? []) as LoanAggregate[];

  const statsByUnit = new Map<
    string,
    { cartera: number; meta: number; activeClients: number }
  >();

  for (const loan of activeLoans) {
    const existing = statsByUnit.get(loan.unit_id) ?? {
      cartera: 0,
      meta: 0,
      activeClients: 0
    };
    existing.cartera += Number(loan.saldo);
    existing.meta += Number(loan.valor_cuota);
    existing.activeClients += 1;
    statsByUnit.set(loan.unit_id, existing);
  }

  const unitsWithStats = units.map((unit) => ({
    ...unit,
    stats: statsByUnit.get(unit.id) ?? { cartera: 0, meta: 0, activeClients: 0 }
  }));

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            {units.length} unidad(es) registrada(s)
          </p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
      </div>

      <UnitsListClient units={unitsWithStats} />
    </div>
  );
}
