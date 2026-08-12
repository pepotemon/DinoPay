"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getClientPaymentsAction, getClientLoansAction } from "@/lib/actions/admin/client-history";
import { deactivateClientAction, updateClientInlineAction } from "@/lib/actions/admin/clients";
import { cancelLoanFromHubAction } from "@/lib/actions/admin/unit-hub";
import { RouteSelector } from "@/components/admin/route-selector";
import { SlideOver } from "@/components/admin/slide-over";

type ClientWithLoan = {
  id: string;
  alias: string;
  nit: string | null;
  telefono1: string | null;
  telefono2: string | null;
  direccion1: string | null;
  barrio: string | null;
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

type HistoryModal = {
  type: "pagos" | "prestamos";
  client: ClientWithLoan;
};

type PaymentRow = {
  id: string;
  monto: number;
  numero_cuotas: number;
  metodo_pago: string;
  fecha_pago: string;
  hora_registro: string;
};

type LoanRow = {
  id: string;
  modalidad: string;
  interes: number;
  valor_neto: number;
  valor_cuota: number;
  saldo: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  estado: string;
  created_at: string;
};

export function UnidadClientesClient({
  clients,
  unitId,
  unitName,
  units
}: {
  clients: ClientWithLoan[];
  unitId: string;
  unitName: string;
  today: string;
  units: { id: string; nombre_unidad: string; activo: boolean }[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("activos");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<HistoryModal | null>(null);
  const [historyData, setHistoryData] = useState<unknown[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editClient, setEditClient] = useState<ClientWithLoan | null>(null);

  // Sticky refs — keep last non-null value so SlideOver content stays during close animation
  const lastHistoryModal = useRef(historyModal);
  if (historyModal) lastHistoryModal.current = historyModal;
  const lastEditClient = useRef(editClient);
  if (editClient) lastEditClient.current = editClient;

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

  async function openPaymentHistory(client: ClientWithLoan) {
    setMenuOpenId(null);
    setHistoryModal({ type: "pagos", client });
    setHistoryLoading(true);
    const data = await getClientPaymentsAction(client.loan!.id);
    setHistoryData(data);
    setHistoryLoading(false);
  }

  async function openLoanHistory(client: ClientWithLoan) {
    setMenuOpenId(null);
    setHistoryModal({ type: "prestamos", client });
    setHistoryLoading(true);
    const data = await getClientLoansAction(client.id);
    setHistoryData(data);
    setHistoryLoading(false);
  }

  async function handleCancelLoan(client: ClientWithLoan) {
    setMenuOpenId(null);
    if (!confirm("¿Cancelar el préstamo activo de este cliente?")) return;
    const formData = new FormData();
    formData.set("loanId", client.loan!.id);
    formData.set("unitId", unitId);
    await cancelLoanFromHubAction(formData);
  }

  function openEditClient(client: ClientWithLoan) {
    setMenuOpenId(null);
    setEditClient(client);
  }

  async function handleDeactivateClient(client: ClientWithLoan) {
    setMenuOpenId(null);
    if (!confirm("¿Desactivar este cliente?")) return;
    const formData = new FormData();
    formData.set("clientId", client.id);
    formData.set("unitId", unitId);
    await deactivateClientAction(formData);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
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
        <RouteSelector units={units} currentUnitId={unitId} currentUnitName={unitName} />
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
            <ClientCard
              key={client.id}
              client={client}
              unitId={unitId}
              menuOpen={menuOpenId === client.id}
              onMenuToggle={(id) =>
                setMenuOpenId((prev) => (prev === id ? null : id))
              }
              onPaymentHistory={() => openPaymentHistory(client)}
              onLoanHistory={() => openLoanHistory(client)}
              onCancelLoan={() => handleCancelLoan(client)}
              onDeactivateClient={() => handleDeactivateClient(client)}
              onEditClient={() => openEditClient(client)}
            />
          ))
        )}
      </div>

      {/* Edit client slide-over */}
      <EditClientModal
        open={editClient !== null}
        client={lastEditClient.current}
        unitId={unitId}
        onClose={() => setEditClient(null)}
      />

      {/* History slide-over */}
      <ClientHistoryModal
        open={historyModal !== null}
        type={lastHistoryModal.current?.type ?? "pagos"}
        clientName={lastHistoryModal.current?.client.alias ?? ""}
        loading={historyLoading}
        data={historyData}
        onClose={() => { setHistoryModal(null); setHistoryData([]); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClientCard
// ---------------------------------------------------------------------------

function ClientCard({
  client,
  unitId,
  menuOpen,
  onMenuToggle,
  onPaymentHistory,
  onLoanHistory,
  onCancelLoan,
  onDeactivateClient,
  onEditClient
}: {
  client: ClientWithLoan;
  unitId: string;
  menuOpen: boolean;
  onMenuToggle: (id: string) => void;
  onPaymentHistory: () => void;
  onLoanHistory: () => void;
  onCancelLoan: () => void;
  onDeactivateClient: () => void;
  onEditClient: () => void;
}) {
  const loan = client.loan;
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuToggle(client.id);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, client.id, onMenuToggle]);

  return (
    <div className="relative rounded-2xl border bg-background p-4 shadow-sm space-y-3">
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

        {/* Actions row */}
        <div className="shrink-0 flex items-center gap-1">
          {/* 3-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Más opciones"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle(client.id);
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-xl border bg-background shadow-lg overflow-hidden">
                {/* Historial de pagos */}
                <button
                  type="button"
                  disabled={!loan}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                    loan
                      ? "hover:bg-muted"
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={onPaymentHistory}
                >
                  Historial de pagos
                </button>

                {/* Historial de préstamos */}
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  onClick={onLoanHistory}
                >
                  Historial de préstamos
                </button>

                <div className="border-t my-0.5" />

                {/* Cancelar préstamo */}
                <button
                  type="button"
                  disabled={!loan}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm text-destructive transition-colors",
                    loan
                      ? "hover:bg-muted"
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={onCancelLoan}
                >
                  Cancelar préstamo
                </button>

                {/* Desactivar cliente */}
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                  onClick={onDeactivateClient}
                >
                  Desactivar cliente
                </button>

                <div className="border-t my-0.5" />

                {/* Editar cliente */}
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  onClick={onEditClient}
                >
                  Editar cliente
                </button>
              </div>
            )}
          </div>
        </div>
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

// ---------------------------------------------------------------------------
// ClientHistoryModal
// ---------------------------------------------------------------------------

function ClientHistoryModal({
  open,
  type,
  clientName,
  loading,
  data,
  onClose
}: {
  open: boolean;
  type: "pagos" | "prestamos";
  clientName: string;
  loading: boolean;
  data: unknown[];
  onClose: () => void;
}) {
  const title = type === "pagos" ? "Historial de pagos" : "Historial de préstamos";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={title}
      description={<span className="uppercase">{clientName}</span>}
    >
      <div className="px-5 py-4 lg:px-7">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : type === "pagos" ? (
          <PaymentsList rows={data as PaymentRow[]} />
        ) : (
          <LoansList rows={data as LoanRow[]} />
        )}
      </div>
    </SlideOver>
  );
}

// ---------------------------------------------------------------------------
// PaymentsList
// ---------------------------------------------------------------------------

function PaymentsList({ rows }: { rows: PaymentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay pagos registrados
      </p>
    );
  }

  const total = rows.reduce((acc, r) => acc + r.monto, 0);

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{r.fecha_pago}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {r.metodo_pago} · {r.numero_cuotas} cuota{r.numero_cuotas !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-green-700 font-semibold shrink-0">
            {formatCurrency(r.monto)}
          </p>
        </div>
      ))}
      <div className="flex items-center justify-between px-1 pt-3 border-t">
        <p className="text-sm font-bold">Total cobrado</p>
        <p className="text-sm font-bold text-green-700">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoansList
// ---------------------------------------------------------------------------

function LoansList({ rows }: { rows: LoanRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Sin préstamos anteriores
      </p>
    );
  }

  function estadoBadge(estado: string) {
    if (estado === "activo") return "bg-green-100 text-green-800";
    if (estado === "completado") return "bg-muted text-muted-foreground";
    return "bg-red-100 text-red-800"; // cancelado u otros
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div
          key={r.id}
          className="rounded-xl border bg-background p-4 space-y-2"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                estadoBadge(r.estado)
              )}
            >
              {r.estado}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {r.modalidad} · {r.interes}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Valor neto</p>
              <p className="font-semibold">{formatCurrency(r.valor_neto)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="font-semibold">{formatCurrency(r.saldo)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cuotas</p>
              <p className="font-semibold">
                {r.cuotas_pagadas}/{r.numero_cuotas}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por cuota</p>
              <p className="font-semibold">{formatCurrency(r.valor_cuota)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditClientModal
// ---------------------------------------------------------------------------

function EditClientModal({
  open,
  client,
  unitId,
  onClose
}: {
  open: boolean;
  client: ClientWithLoan | null;
  unitId: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await updateClientInlineAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Editar cliente"
      description={client ? <span className="uppercase">{client.alias}</span> : undefined}
      footer={
        client ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-client-form"
              disabled={pending}
              className="flex-1 h-10 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        ) : undefined
      }
    >
      {client && (
        <form
          key={client.id}
          id="edit-client-form"
          onSubmit={handleSubmit}
          className="space-y-3 px-5 py-4 lg:px-7"
        >
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="unitId" value={unitId} />

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <EditField label="Nombre / Alias *">
            <input
              name="alias"
              defaultValue={client.alias}
              required
              placeholder="Nombre del cliente"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </EditField>
          <EditField label="NIT / Cédula">
            <input
              name="nit"
              defaultValue={client.nit ?? ""}
              placeholder="Documento de identidad"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </EditField>
          <EditField label="Teléfono 1">
            <input
              name="telefono1"
              type="tel"
              defaultValue={client.telefono1 ?? ""}
              placeholder="Número de contacto"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </EditField>
          <EditField label="Teléfono 2">
            <input
              name="telefono2"
              type="tel"
              defaultValue={client.telefono2 ?? ""}
              placeholder="Número alternativo"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </EditField>
          <EditField label="Dirección">
            <input
              name="direccion1"
              defaultValue={client.direccion1 ?? ""}
              placeholder="Dirección del cliente"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </EditField>
          <EditField label="Barrio">
            <input
              name="barrio"
              defaultValue={client.barrio ?? ""}
              placeholder="Barrio o sector"
              className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </EditField>
        </form>
      )}
    </SlideOver>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-xs font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
