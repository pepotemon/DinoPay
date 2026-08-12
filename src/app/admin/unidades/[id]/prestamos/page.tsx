import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelLoanButton } from "@/components/admin/cancel-loan-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatCurrency } from "@/lib/utils";

type LoanRow = {
  id: string;
  modalidad: string;
  interes: number;
  valor_neto: number;
  total_a_cobrar: number;
  valor_cuota: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  saldo: number;
  estado: string;
  fecha_inicio: string | null;
  created_at: string;
  clients: { alias: string } | { alias: string }[] | null;
};

function getAlias(clients: { alias: string } | { alias: string }[] | null): string {
  if (!clients) return "Cliente";
  if (Array.isArray(clients)) return clients[0]?.alias ?? "Cliente";
  return clients.alias;
}

const ESTADO_LABELS: Record<string, string> = {
  activo: "Activo",
  completado: "Completado",
  cancelado: "Cancelado"
};

const ESTADO_COLORS: Record<string, string> = {
  activo: "bg-green-100 text-green-800",
  completado: "bg-blue-100 text-blue-800",
  cancelado: "bg-muted text-muted-foreground"
};

export default async function AdminUnidadPrestamosPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const adminClient = createAdminClient();

  const { data: unitData } = await adminClient
    .from("units")
    .select("id, nombre_unidad, username")
    .eq("id", id)
    .maybeSingle();

  if (!unitData) notFound();

  const { data: rawLoans } = await adminClient
    .from("loans")
    .select("id, modalidad, interes, valor_neto, total_a_cobrar, valor_cuota, numero_cuotas, cuotas_pagadas, saldo, estado, fecha_inicio, created_at, clients(alias)")
    .eq("unit_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  const loans = (rawLoans ?? []) as unknown as LoanRow[];
  const activos = loans.filter((l) => l.estado === "activo");
  const historico = loans.filter((l) => l.estado !== "activo");

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href={`/admin/unidades/${id}`}>
          <ArrowLeft className="h-4 w-4" />
          Unidad
        </Link>
      </Button>

      <div>
        <p className="text-sm font-bold text-primary">@{unitData.username}</p>
        <h1 className="text-2xl font-semibold">Préstamos</h1>
        <p className="text-sm text-muted-foreground">{unitData.nombre_unidad}</p>
      </div>

      {sp?.ok ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {sp.ok}
        </div>
      ) : null}
      {sp?.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {sp.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Activos ({activos.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin préstamos activos.</p>
          ) : (
            activos.map((loan) => (
              <LoanCard key={loan.id} loan={loan} unitId={id} showCancel />
            ))
          )}
        </CardContent>
      </Card>

      {historico.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historico.map((loan) => (
              <LoanCard key={loan.id} loan={loan} unitId={id} showCancel={false} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function LoanCard({
  loan,
  unitId,
  showCancel
}: {
  loan: LoanRow;
  unitId: string;
  showCancel: boolean;
}) {
  const alias = getAlias(loan.clients);

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{alias}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {loan.modalidad} · {loan.interes}% · {loan.fecha_inicio ?? loan.created_at.slice(0, 10)}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_COLORS[loan.estado])}>
          {ESTADO_LABELS[loan.estado] ?? loan.estado}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Prestado</p>
          <p className="font-semibold">{formatCurrency(Number(loan.valor_neto))}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="font-semibold">{formatCurrency(Number(loan.saldo))}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cuotas</p>
          <p className="font-semibold">{loan.cuotas_pagadas}/{loan.numero_cuotas}</p>
        </div>
      </div>

      {showCancel ? (
        <CancelLoanButton
          clientAlias={alias}
          loanId={loan.id}
          unitId={unitId}
          valorNeto={Number(loan.valor_neto)}
        />
      ) : null}
    </div>
  );
}
