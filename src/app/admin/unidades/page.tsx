import { Building2 } from "lucide-react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatCurrency } from "@/lib/utils";

type UnitRow = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  ciudad: string;
  capital_inicial: number;
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
      .select("id, username, nombre_unidad, encargado, ciudad, capital_inicial, activo")
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

      <div className="space-y-3">
        {units.map((unit) => {
          const stats = statsByUnit.get(unit.id) ?? {
            cartera: 0,
            meta: 0,
            activeClients: 0
          };
          return (
            <Link href={`/admin/unidades/${unit.id}`} key={unit.id}>
              <div className="rounded-2xl border bg-background p-4 shadow-sm transition-colors hover:bg-muted/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{unit.nombre_unidad}</p>
                    <p className="text-sm text-muted-foreground">
                      @{unit.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unit.encargado} · {unit.ciudad}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      unit.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {unit.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Cartera</p>
                    <p className="font-semibold text-primary">
                      {formatCurrency(stats.cartera)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clientes activos</p>
                    <p className="font-semibold">{stats.activeClients}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meta día</p>
                    <p className="font-semibold">{formatCurrency(stats.meta)}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {units.length === 0 ? (
          <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground shadow-sm">
            No hay unidades registradas aún.
          </div>
        ) : null}
      </div>
    </div>
  );
}
