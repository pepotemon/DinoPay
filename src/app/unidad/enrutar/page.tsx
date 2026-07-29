import { RouteSorter } from "@/components/unidad/route-sorter";
import { PageDino } from "@/components/unidad/page-dino";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type LoanRow = {
  id: string;
  valor_cuota: number;
  clients:
    | { alias: string; barrio: string | null }
    | { alias: string; barrio: string | null }[]
    | null;
};

export default async function EnrutarPage() {
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
    <div className="pb-6">
      {/* Hero */}
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div>
          <h1 className="text-4xl font-black">Enrutar</h1>
          <p className="text-lg font-bold text-primary">
            {routeLoans.length} cliente{routeLoans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PageDino label="Enrutar clientes" variant="route" />
      </div>

      {routeLoans.length > 0 ? (
        <RouteSorter loans={routeLoans} />
      ) : (
        <p className="rounded-2xl border px-4 py-8 text-center text-sm text-muted-foreground">
          Sin préstamos activos para enrutar. Crea uno desde Nuevo.
        </p>
      )}
    </div>
  );
}
