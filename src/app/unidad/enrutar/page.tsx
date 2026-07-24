import { RouteSorter } from "@/components/unidad/route-sorter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRouteAction } from "@/lib/actions/unidad/ruta";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type LoanRow = {
  id: string;
  valor_cuota: number;
  clients:
    | {
        alias: string;
        barrio: string | null;
      }
    | {
        alias: string;
        barrio: string | null;
      }[]
    | null;
};

export default async function EnrutarPage({
  searchParams
}: {
  searchParams?: Promise<{
    error?: string;
    ok?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: loans } = user
    ? await adminClient
        .from("loans")
        .select("id, valor_cuota, clients(alias, barrio)")
        .eq("unit_id", user.id)
        .eq("estado", "activo")
        .order("posicion", { ascending: true })
    : { data: [] };

  const routeLoans = ((loans ?? []) as unknown as LoanRow[]).map((loan) => {
    const client = Array.isArray(loan.clients) ? loan.clients[0] : loan.clients;
    return {
      id: loan.id,
      alias: client?.alias ?? "Cliente sin nombre",
      barrio: client?.barrio ?? null,
      valorCuota: Number(loan.valor_cuota)
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Enrutar</h1>
        <p className="text-sm text-muted-foreground">
          Ordena la ruta de cobro. Arrastra desde el icono.
        </p>
      </div>

      {params?.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      {params?.ok ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {params.ok}
        </div>
      ) : null}

      {routeLoans.length > 0 ? (
        <RouteSorter action={updateRouteAction} loans={routeLoans} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sin prestamos activos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cuando haya prestamos activos, podras ordenarlos aqui.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
