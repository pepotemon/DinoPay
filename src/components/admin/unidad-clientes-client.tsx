"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type ClientWithLoan = {
  id: string;
  alias: string;
  nit: string | null;
  telefono1: string | null;
  activo: boolean;
  loan: {
    id: string;
    modalidad: string;
    interes: number;
    valor_neto: number;
    valor_cuota: number;
    saldo: number;
    numero_cuotas: number;
    cuotas_pagadas: number;
    ultima_cuota_fecha: string | null;
  } | null;
};

type FilterKey = "todos" | "activos" | "disponibles" | "inactivos";

export function UnidadClientesClient({
  clients,
  unitId,
  unitName
}: {
  clients: ClientWithLoan[];
  unitId: string;
  unitName: string;
  today: string;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("activos");

  const activos = clients.filter((c) => c.activo && c.loan !== null);
  const disponibles = clients.filter((c) => c.activo && c.loan === null);
  const inactivos = clients.filter((c) => !c.activo);

  const baseFiltered =
    filter === "todos"
      ? clients
      : filter === "activos"
      ? activos
      : filter === "disponibles"
      ? disponibles
      : inactivos;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? baseFiltered.filter(
        (c) =>
          c.alias.toLowerCase().includes(q) ||
          (c.nit ?? "").toLowerCase().includes(q)
      )
    : baseFiltered;

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: clients.length },
    { key: "activos", label: "Activos", count: activos.length },
    { key: "disponibles", label: "Disponibles", count: disponibles.length },
    { key: "inactivos", label: "Inactivos", count: inactivos.length }
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <Link
          className="lg:hidden inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80 mb-3"
          href="/admin/unidades"
        >
          ← Unidades
        </Link>
        <h1 className="text-2xl font-semibold">Clientes y préstamos</h1>
        <p className="text-sm text-muted-foreground">{unitName}</p>
      </div>

      {/* Search */}
      <input
        className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
        placeholder="Buscar por nombre o NIT…"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Counter */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border bg-background p-6 text-sm text-muted-foreground shadow-sm">
            Sin clientes en esta categoría.
          </div>
        ) : (
          filtered.map((client) => (
            <ClientCard client={client} key={client.id} unitId={unitId} />
          ))
        )}
      </div>
    </div>
  );
}

function ClientCard({
  client,
  unitId
}: {
  client: ClientWithLoan;
  unitId: string;
}) {
  const loan = client.loan;

  const statusBadge =
    client.activo && loan
      ? { label: "Activo", cls: "bg-green-100 text-green-800" }
      : client.activo
      ? { label: "Disponible", cls: "bg-blue-100 text-blue-800" }
      : { label: "Inactivo", cls: "bg-muted text-muted-foreground" };

  const progress = loan
    ? Math.min(
        100,
        Math.round((loan.cuotas_pagadas / loan.numero_cuotas) * 100)
      )
    : 0;

  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold uppercase leading-tight">{client.alias}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                statusBadge.cls
              )}
            >
              {statusBadge.label}
            </span>
          </div>
          {client.nit ? (
            <p className="mt-0.5 text-xs text-muted-foreground">NIT: {client.nit}</p>
          ) : null}
        </div>
        <Link
          href={`/admin/unidades/${unitId}/clientes/${client.id}`}
          className="shrink-0 flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
        >
          Ver historial
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {loan ? (
        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
              {loan.modalidad} · {loan.interes}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-lg font-bold leading-tight">
                {formatCurrency(loan.saldo)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por cuota</p>
              <p className="font-semibold">{formatCurrency(loan.valor_cuota)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {loan.cuotas_pagadas}/{loan.numero_cuotas} cuotas
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
