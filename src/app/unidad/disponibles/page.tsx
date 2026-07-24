import { Clock, Phone, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type ClientRow = {
  id: string;
  alias: string;
  direccion1: string | null;
  barrio: string | null;
  telefono1: string | null;
  genero: string | null;
};

type LoanHistoryRow = {
  client_id: string;
  valor_neto: number;
  total_a_cobrar: number;
  fecha_fin: string | null;
  updated_at?: string | null;
  created_at: string;
};

export default async function ClientesDisponiblesPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const [{ data: clients }, { data: activeLoans }, { data: completedLoans }] = user
    ? await Promise.all([
        adminClient
          .from("clients")
          .select("id, alias, direccion1, barrio, telefono1, genero")
          .eq("unit_id", user.id)
          .eq("activo", true)
          .order("created_at", { ascending: false }),
        adminClient
          .from("loans")
          .select("client_id")
          .eq("unit_id", user.id)
          .eq("estado", "activo"),
        adminClient
          .from("loans")
          .select("client_id, valor_neto, total_a_cobrar, fecha_fin, created_at")
          .eq("unit_id", user.id)
          .eq("estado", "completado")
          .order("created_at", { ascending: false })
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const activeClientIds = new Set((activeLoans ?? []).map((loan) => loan.client_id));
  const latestCompletedByClient = new Map<string, LoanHistoryRow>();

  for (const loan of (completedLoans ?? []) as LoanHistoryRow[]) {
    if (!latestCompletedByClient.has(loan.client_id)) {
      latestCompletedByClient.set(loan.client_id, loan);
    }
  }

  const availableClients = ((clients ?? []) as ClientRow[]).filter(
    (client) => !activeClientIds.has(client.id)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes disponibles</h1>
          <p className="text-sm text-muted-foreground">
            Clientes activos sin prestamo activo.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/unidad/nuevo">
            <PlusCircle className="h-4 w-4" />
            Nuevo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{availableClients.length}</p>
          <p className="text-sm text-muted-foreground">clientes listos para nuevo prestamo</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {availableClients.map((client) => {
          const lastLoan = latestCompletedByClient.get(client.id);

          return (
            <Card key={client.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{client.alias}</p>
                    <p className="text-sm text-muted-foreground">
                      {[client.direccion1, client.barrio].filter(Boolean).join(", ") ||
                        "Sin direccion registrada"}
                    </p>
                    {client.telefono1 ? (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {client.telefono1}
                      </p>
                    ) : null}
                  </div>
                  {client.genero ? (
                    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {client.genero}
                    </span>
                  ) : null}
                </div>

                {lastLoan ? (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="flex items-center gap-1 font-medium">
                      <Clock className="h-4 w-4" />
                      Ultimo prestamo
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-semibold">
                          {formatCurrency(Number(lastLoan.valor_neto))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total cobrado</p>
                        <p className="font-semibold">
                          {formatCurrency(Number(lastLoan.total_a_cobrar))}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Cliente sin historial de prestamos completados.
                  </p>
                )}

                <Button asChild className="h-12 w-full">
                  <Link href={`/unidad/disponibles/${client.id}/nuevo`}>
                    <PlusCircle className="h-4 w-4" />
                    Nuevo prestamo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {availableClients.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay clientes disponibles. Cuando un prestamo se complete, el cliente
              aparecera aqui.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
