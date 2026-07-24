import { Building2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

type UnitRow = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  ciudad: string;
  capital_inicial: number;
  activo: boolean;
};

export default async function AdminUnidadesPage() {
  const adminClient = createAdminClient();
  const { data: units } = await adminClient
    .from("units")
    .select("id, username, nombre_unidad, encargado, ciudad, capital_inicial, activo")
    .order("nombre_unidad", { ascending: true });

  const rows = (units ?? []) as UnitRow[];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} unidad(es) registrada(s)
          </p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((unit) => (
          <Link href={`/admin/unidades/${unit.id}`} key={unit.id}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{unit.nombre_unidad}</p>
                    <p className="text-sm text-muted-foreground">
                      @{unit.username} · {unit.encargado}
                    </p>
                    <p className="text-xs text-muted-foreground">{unit.ciudad}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(Number(unit.capital_inicial))}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        unit.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {unit.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {rows.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay unidades registradas aún.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
