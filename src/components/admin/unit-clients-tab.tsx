"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { cancelLoanFromHubAction } from "@/lib/actions/admin/unit-hub";
import { cn, formatCurrency } from "@/lib/utils";
import { calcularDiasAtraso } from "@/lib/utils/overdue";

type AdminClientWithLoan = {
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
    estado: string;
  } | null;
};

type Filter = "activos" | "disponibles" | "inactivos";

export function UnitClientsTab({
  clients,
  unitId,
  today
}: {
  clients: AdminClientWithLoan[];
  unitId: string;
  today: string;
}) {
  const [filter, setFilter] = useState<Filter>("activos");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activos = clients.filter((c) => c.activo && c.loan !== null);
  const disponibles = clients.filter((c) => c.activo && c.loan === null);
  const inactivos = clients.filter((c) => !c.activo);

  const filtered =
    filter === "activos" ? activos : filter === "disponibles" ? disponibles : inactivos;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2" ref={menuRef as unknown as React.RefObject<HTMLDivElement>}>
        <FilterBtn
          active={filter === "activos"}
          count={activos.length}
          label="Activos"
          onClick={() => setFilter("activos")}
        />
        <FilterBtn
          active={filter === "disponibles"}
          count={disponibles.length}
          label="Disponibles"
          onClick={() => setFilter("disponibles")}
        />
        <FilterBtn
          active={filter === "inactivos"}
          count={inactivos.length}
          label="Inactivos"
          onClick={() => setFilter("inactivos")}
        />
      </div>

      <div className="space-y-3" ref={menuRef}>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin clientes en esta categoría.</p>
        ) : (
          filtered.map((client) => (
            <ClientCard
              client={client}
              isMenuOpen={openMenuId === client.id}
              key={client.id}
              onMenuToggle={() =>
                setOpenMenuId(openMenuId === client.id ? null : client.id)
              }
              today={today}
              unitId={unitId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterBtn({
  label,
  count,
  active,
  onClick
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
      onClick={onClick}
      type="button"
    >
      {label} ({count})
    </button>
  );
}

function ClientCard({
  client,
  unitId,
  today,
  isMenuOpen,
  onMenuToggle
}: {
  client: AdminClientWithLoan;
  unitId: string;
  today: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const loan = client.loan;
  const diasAtraso = loan
    ? calcularDiasAtraso(loan.ultima_cuota_fecha, new Set(), today)
    : 0;

  const statusBadge = client.activo && loan
    ? { label: "Activo", cls: "bg-green-100 text-green-800" }
    : client.activo
    ? { label: "Disponible", cls: "bg-muted text-muted-foreground" }
    : { label: "Inactivo", cls: "bg-red-100 text-red-800" };

  return (
    <div className="relative rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold uppercase">{client.alias}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                statusBadge.cls
              )}
            >
              {statusBadge.label}
            </span>
            {diasAtraso > 0 && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                {diasAtraso}d atraso
              </span>
            )}
            {loan && diasAtraso < 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Adelantado
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {client.nit ? <span>NIT: {client.nit}</span> : null}
            {client.telefono1 ? <span>{client.telefono1}</span> : null}
          </div>
        </div>

        <button
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          onClick={onMenuToggle}
          type="button"
        >
          ⋮
        </button>
      </div>

      {loan ? (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground capitalize">
              {loan.modalidad} {loan.interes}%
            </p>
            <p className="font-semibold">{formatCurrency(loan.valor_cuota)}/cuota</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="font-semibold">{formatCurrency(loan.saldo)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cuotas</p>
            <p className="font-semibold">
              {loan.cuotas_pagadas}/{loan.numero_cuotas}
            </p>
          </div>
        </div>
      ) : null}

      {isMenuOpen ? (
        <div className="absolute right-2 top-10 z-50 min-w-[180px] rounded-xl border bg-background shadow-lg">
          <Link
            className="block px-4 py-2.5 text-sm hover:bg-muted"
            href={`/admin/unidades/${unitId}/clientes/${client.id}`}
            onClick={onMenuToggle}
          >
            Ver historial
          </Link>
          {loan ? (
            <CancelLoanMenuItem
              clientAlias={client.alias}
              loanId={loan.id}
              onDone={onMenuToggle}
              unitId={unitId}
              valorNeto={loan.valor_neto}
            />
          ) : null}
          <button
            className="w-full cursor-not-allowed px-4 py-2.5 text-left text-sm text-muted-foreground"
            disabled
            type="button"
          >
            Desactivar cliente (próximamente)
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CancelLoanMenuItem({
  loanId,
  unitId,
  clientAlias,
  valorNeto,
  onDone
}: {
  loanId: string;
  unitId: string;
  clientAlias: string;
  valorNeto: number;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        `¿Cancelar el préstamo de ${clientAlias} por ${formatCurrency(valorNeto)}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    onDone();
    const formData = new FormData();
    formData.set("loanId", loanId);
    formData.set("unitId", unitId);
    startTransition(() => cancelLoanFromHubAction(formData));
  }

  return (
    <button
      className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
      disabled={pending}
      onClick={handleClick}
      type="button"
    >
      {pending ? "Cancelando…" : "Cancelar préstamo"}
    </button>
  );
}
