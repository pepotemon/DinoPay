import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DisponiblesClient,
  type AvailableClient,
  type CompletedLoan
} from "@/components/unidad/disponibles-client";
import { PageDino } from "@/components/unidad/page-dino";

type ClientRow = {
  id: string;
  alias: string;
  nit: string | null;
  direccion1: string | null;
  direccion2: string | null;
  barrio: string | null;
  telefono1: string | null;
  telefono2: string | null;
  genero: string | null;
};

type CompletedLoanRow = CompletedLoan & { client_id: string };

// Shell síncrono — hero visible al instante
export default function ClientesDisponiblesPage() {
  return (
    <div className="pb-6">
      <div className="flex items-end justify-between px-1 pb-6 pt-2">
        <div>
          <h1 className="text-4xl font-black">Clientes</h1>
          <p className="text-lg font-bold text-primary">Disponibles</p>
        </div>
        <PageDino label="Clientes disponibles" variant="available" />
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <ClientListWithSearch />
      </Suspense>
    </div>
  );
}

async function ClientListWithSearch() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const [{ data: clients }, { data: activeLoans }, { data: completedLoans }] = await Promise.all([
    adminClient
      .from("clients")
      .select("id, alias, nit, direccion1, direccion2, barrio, telefono1, telefono2, genero")
      .eq("unit_id", user.id)
      .eq("activo", true)
      .order("alias", { ascending: true }),
    adminClient.from("loans").select("client_id").eq("unit_id", user.id).eq("estado", "activo"),
    adminClient
      .from("loans")
      .select(
        "id, client_id, valor_neto, total_a_cobrar, saldo, cuotas_pagadas, numero_cuotas, valor_cuota, interes, modalidad, estado, fecha_inicio, fecha_fin, created_at"
      )
      .eq("unit_id", user.id)
      .eq("estado", "completado")
      .order("created_at", { ascending: false })
  ]);

  const activeClientIds = new Set((activeLoans ?? []).map((l) => l.client_id));

  const historyByClient = new Map<string, CompletedLoanRow[]>();
  for (const loan of (completedLoans ?? []) as CompletedLoanRow[]) {
    const arr = historyByClient.get(loan.client_id) ?? [];
    arr.push(loan);
    historyByClient.set(loan.client_id, arr);
  }

  const availableClients: AvailableClient[] = ((clients ?? []) as ClientRow[])
    .filter((c) => !activeClientIds.has(c.id))
    .map((c) => {
      const history = historyByClient.get(c.id) ?? [];
      return {
        id: c.id,
        alias: c.alias,
        nit: c.nit,
        direccion1: c.direccion1,
        direccion2: c.direccion2,
        barrio: c.barrio,
        telefono1: c.telefono1,
        telefono2: c.telefono2,
        genero: c.genero,
        lastLoan: history[0]
          ? { valor_neto: history[0].valor_neto, created_at: history[0].created_at }
          : null,
        loanCount: history.length,
        loanHistory: history
      };
    });

  return <DisponiblesClient clients={availableClients} />;
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="h-12 rounded-xl bg-muted" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-3 w-44 rounded bg-muted" />
                <div className="h-3 w-52 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
