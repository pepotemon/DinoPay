"use client";

import {
  CircleSlash,
  Eye,
  MessageCircle,
  Phone,
  PlusCircle,
  Search,
  SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentInputs } from "@/components/unidad/payment-inputs";
import {
  markNoPayVisitResult,
  registerPaymentAction
} from "@/lib/actions/unidad/payments";
import { cn, formatCurrency } from "@/lib/utils";

export type ClientLoan = {
  id: string;
  valor_cuota: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  posicion: number | null;
  clients: {
    alias: string;
    barrio: string | null;
    telefono1: string | null;
    telefono2: string | null;
  } | null;
};

type Props = {
  loans: ClientLoan[];
  paidLoanIds: string[];
  noPayLoanIds: string[];
  cobradoHoy: number;
  meta: number;
  totalSaldo: number;
};

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function whatsappHref(phone: string, alias: string) {
  const msg = encodeURIComponent(`Hola ${alias}, te escribo de DinoPay sobre tu prestamo.`);
  return `https://wa.me/${digitsOnly(phone)}?text=${msg}`;
}

export function PrestamosClient({
  loans,
  paidLoanIds,
  noPayLoanIds,
  cobradoHoy,
  meta,
  totalSaldo
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "pendientes" | "visitados">("todos");
  const [, startTransition] = useTransition();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const paidSet = new Set(paidLoanIds);
  const noPaySet = new Set(noPayLoanIds);
  const visitedSet = new Set([...paidLoanIds, ...noPayLoanIds]);

  const faltante = Math.max(meta - cobradoHoy, 0);
  const progreso = meta > 0 ? Math.min(Math.round((cobradoHoy / meta) * 100), 100) : 0;

  const filtered = loans.filter((loan) => {
    const matchesFilter =
      filter === "todos" ||
      (filter === "pendientes" && !visitedSet.has(loan.id)) ||
      (filter === "visitados" && visitedSet.has(loan.id));
    const q = search.toLowerCase();
    const searchable = [loan.clients?.alias, loan.clients?.barrio, loan.clients?.telefono1]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesFilter && (!q || searchable.includes(q));
  });

  function handlePayment(loanId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSubmittingId(loanId);
    startTransition(async () => {
      const result = await registerPaymentAction({ ok: false, message: "" }, formData);
      setSubmittingId(null);
      if (result.ok) {
        toast.success("Pago registrado");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleNoPay(loanId: string) {
    setSubmittingId(loanId);
    startTransition(async () => {
      const result = await markNoPayVisitResult(loanId);
      setSubmittingId(null);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Préstamos de hoy</h1>
          <p className="text-sm text-muted-foreground">Ruta ordenada por posición.</p>
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
          <CardTitle>Totalizador del día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat highlight label="Recaudado" value={formatCurrency(cobradoHoy)} />
            <Stat label="Meta" value={formatCurrency(meta)} />
            <Stat label="Faltante" value={formatCurrency(faltante)} />
            <Stat label="Visitados" value={`${visitedSet.size}/${loans.length}`} />
          </div>
          <div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${progreso}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{progreso}% completado</p>
          </div>
          <p className="text-xs text-muted-foreground">Cartera total: {formatCurrency(totalSaldo)}</p>
        </CardContent>
      </Card>

      {/* Filtros + búsqueda — 100% cliente, sin navegación */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setFilter("todos")}
            size="sm"
            variant={filter === "todos" ? "default" : "secondary"}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Todos
          </Button>
          <Button
            onClick={() => setFilter("pendientes")}
            size="sm"
            variant={filter === "pendientes" ? "default" : "secondary"}
          >
            Pendientes
          </Button>
          <Button
            onClick={() => setFilter("visitados")}
            size="sm"
            variant={filter === "visitados" ? "default" : "secondary"}
          >
            Visitados
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o barrio..."
            type="search"
            value={search}
          />
        </div>
      </div>

      <div className="space-y-3 pb-8">
        {filtered.map((loan) => {
          const phone = loan.clients?.telefono1 || loan.clients?.telefono2 || "";
          const hasPhone = digitsOnly(phone).length > 0;
          const isPaid = paidSet.has(loan.id);
          const isNoPay = noPaySet.has(loan.id) && !isPaid;
          const isVisited = visitedSet.has(loan.id);
          const isSubmitting = submittingId === loan.id;

          return (
            <Card
              className={cn(
                "overflow-hidden border-l-4",
                isPaid && "border-l-green-500",
                isNoPay && "border-l-orange-400",
                !isVisited && "border-l-transparent"
              )}
              key={loan.id}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">
                      {loan.clients?.alias ?? "Cliente sin nombre"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{loan.posicion ?? "-"}
                      {loan.clients?.barrio ? ` · ${loan.clients.barrio}` : ""}
                      {" · "}Cuota {loan.cuotas_pagadas + 1}/{loan.numero_cuotas}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isPaid ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Cobrado
                      </span>
                    ) : isNoPay ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                        Sin pago
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cuota</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(Number(loan.valor_cuota))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-sm font-medium">{formatCurrency(Number(loan.saldo))}</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <Button asChild className="flex-1" size="sm" variant="secondary">
                    <Link href={`/unidad/prestamos/${loan.id}`}>
                      <Eye className="h-4 w-4" />
                      Ver
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-10 shrink-0 px-0"
                    disabled={!hasPhone}
                    size="sm"
                    variant="secondary"
                  >
                    <a href={hasPhone ? `tel:${digitsOnly(phone)}` : undefined}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    className="w-10 shrink-0 px-0"
                    disabled={!hasPhone}
                    size="sm"
                    variant="secondary"
                  >
                    <a
                      href={
                        hasPhone ? whatsappHref(phone, loan.clients?.alias ?? "cliente") : undefined
                      }
                      rel="noreferrer"
                      target="_blank"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  {!isVisited ? (
                    <Button
                      className="w-full"
                      disabled={isSubmitting}
                      onClick={() => handleNoPay(loan.id)}
                      size="sm"
                      variant="secondary"
                    >
                      <CircleSlash className="h-3.5 w-3.5" />
                      Sin pago hoy
                    </Button>
                  ) : null}

                  {isPaid ? (
                    <p className="py-1 text-center text-xs font-medium text-green-700">
                      ✓ Pago del día registrado
                    </p>
                  ) : null}

                  <form className="space-y-2" onSubmit={(e) => handlePayment(loan.id, e)}>
                    <input name="loanId" type="hidden" value={loan.id} />
                    <PaymentInputs
                      isPending={isSubmitting}
                      maxCuotas={Math.max(loan.numero_cuotas - loan.cuotas_pagadas, 1)}
                      valorCuota={Number(loan.valor_cuota)}
                    />
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {loans.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Todavía no hay préstamos activos. Crea el primero desde Nuevo.
            </CardContent>
          </Card>
        )}

        {loans.length > 0 && filtered.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay préstamos que coincidan con este filtro.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold", highlight && "text-primary")}>{value}</p>
    </div>
  );
}
