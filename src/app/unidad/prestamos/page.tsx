import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentInputs } from "@/components/unidad/payment-inputs";
import { registerPaymentFormAction } from "@/lib/actions/unidad/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type LoanRow = {
  id: string;
  valor_cuota: number;
  valor_neto: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  posicion: number | null;
  clients: {
    alias: string;
    barrio: string | null;
    telefono1: string | null;
  } | null;
};

type RawLoanRow = Omit<LoanRow, "clients"> & {
  clients:
    | {
        alias: string;
        barrio: string | null;
        telefono1: string | null;
      }
    | {
        alias: string;
        barrio: string | null;
        telefono1: string | null;
      }[]
    | null;
};

export default async function PrestamosPage({
  searchParams
}: {
  searchParams?: Promise<{
    payment_error?: string;
  }>;
}) {
  const params = await searchParams;
  const paymentError = params?.payment_error;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: loans } = user
    ? await adminClient
        .from("loans")
        .select(
          "id, valor_cuota, valor_neto, saldo, cuotas_pagadas, numero_cuotas, posicion, clients(alias, barrio, telefono1)"
        )
        .eq("unit_id", user.id)
        .eq("estado", "activo")
        .order("posicion", { ascending: true })
    : { data: [] };

  const activeLoans = ((loans ?? []) as unknown as RawLoanRow[]).map((loan) => ({
    ...loan,
    clients: Array.isArray(loan.clients) ? loan.clients[0] ?? null : loan.clients
  }));
  const meta = activeLoans.reduce((sum, loan) => sum + Number(loan.valor_cuota), 0);
  const totalSaldo = activeLoans.reduce((sum, loan) => sum + Number(loan.saldo), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prestamos de hoy</h1>
          <p className="text-sm text-muted-foreground">
            Lista principal de trabajo, ordenada por posicion de ruta.
          </p>
        </div>
        <Button asChild>
          <Link href="/unidad/nuevo">
            <PlusCircle className="h-4 w-4" />
            Nuevo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totalizador del dia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Meta del dia</p>
            <p className="text-2xl font-semibold">{formatCurrency(meta)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo total</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalSaldo)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Clientes</p>
            <p className="text-2xl font-semibold">{activeLoans.length}</p>
          </div>
        </CardContent>
      </Card>

      {paymentError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {paymentError}
        </div>
      ) : null}

      <div className="space-y-3">
        {activeLoans.map((loan) => (
          <Card key={loan.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{loan.clients?.alias ?? "Cliente sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">
                    Posicion {loan.posicion ?? "-"} - Cuota {loan.cuotas_pagadas + 1}/
                    {loan.numero_cuotas}
                  </p>
                  {loan.clients?.barrio ? (
                    <p className="text-sm text-muted-foreground">{loan.clients.barrio}</p>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                  <div>
                    <p className="text-muted-foreground">Cuota</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.valor_cuota))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prestamo</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.valor_neto))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.saldo))}</p>
                  </div>
                </div>
              </div>
              <form
                action={registerPaymentFormAction}
                className="space-y-3 rounded-md border bg-muted/40 p-3"
              >
                <input name="loanId" type="hidden" value={loan.id} />
                <PaymentInputs
                  maxCuotas={Math.max(loan.numero_cuotas - loan.cuotas_pagadas, 1)}
                  valorCuota={Number(loan.valor_cuota)}
                />
              </form>
            </CardContent>
          </Card>
        ))}

        {activeLoans.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Todavia no hay prestamos activos. Crea el primero desde Nuevo.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
