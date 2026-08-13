"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronRight, CreditCard, FileText, Trash2, UserMinus, UserCheck,
  Pencil, AlertTriangle, ArrowLeft, Snowflake, Phone, MessageCircle, Clock, Eye
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function calcDiasAtraso(today: string, ultimaCuotaFecha: string | null): number {
  if (!ultimaCuotaFecha) return 0;
  const todayMs = new Date(today + "T12:00:00Z").getTime();
  const dueMs = new Date(ultimaCuotaFecha + "T12:00:00Z").getTime();
  return Math.max(0, Math.floor((todayMs - dueMs) / 86_400_000));
}

import { getClientPaymentsAction, getClientLoansAction } from "@/lib/actions/admin/client-history";
import {
  deactivateClientAction, updateClientInlineAction,
  freezeClientLoanAction, reactivateClientAction
} from "@/lib/actions/admin/clients";
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
    total_a_cobrar: number;
    saldo: number;
    numero_cuotas: number;
    cuotas_pagadas: number;
    ultima_cuota_fecha: string | null;
    fecha_inicio: string | null;
    estado: "activo" | "congelado";
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
  today,
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
  const [actionsClient, setActionsClient] = useState<ClientWithLoan | null>(null);
  const [historyModal, setHistoryModal] = useState<HistoryModal | null>(null);
  const [historyData, setHistoryData] = useState<unknown[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editClient, setEditClient] = useState<ClientWithLoan | null>(null);

  const lastHistoryModal = useRef(historyModal);
  if (historyModal) lastHistoryModal.current = historyModal;
  const lastEditClient = useRef(editClient);
  if (editClient) lastEditClient.current = editClient;
  const lastActionsClient = useRef(actionsClient);
  if (actionsClient) lastActionsClient.current = actionsClient;

  const activos = clients.filter((c) => c.activo && c.loan?.estado === "activo");
  const disponibles = clients.filter((c) => c.activo && c.loan === null);
  const inactivos = clients.filter((c) => !c.activo);

  const congelados = inactivos.filter((c) => c.loan?.estado === "congelado");
  const totalSaldoCongelado = congelados.reduce((sum, c) => sum + Number(c.loan!.saldo), 0);

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
    setActionsClient(null);
    setHistoryModal({ type: "pagos", client });
    setHistoryLoading(true);
    const data = await getClientPaymentsAction(client.loan!.id);
    setHistoryData(data);
    setHistoryLoading(false);
  }

  async function openLoanHistory(client: ClientWithLoan) {
    setActionsClient(null);
    setHistoryModal({ type: "prestamos", client });
    setHistoryLoading(true);
    const data = await getClientLoansAction(client.id);
    setHistoryData(data);
    setHistoryLoading(false);
  }

  async function handleCancelLoan(client: ClientWithLoan) {
    const formData = new FormData();
    formData.set("loanId", client.loan!.id);
    formData.set("unitId", unitId);
    await cancelLoanFromHubAction(formData);
  }

  async function handleFreezeClientLoan(client: ClientWithLoan) {
    const formData = new FormData();
    formData.set("clientId", client.id);
    formData.set("unitId", unitId);
    await freezeClientLoanAction(formData);
  }

  async function handleDeactivateClient(client: ClientWithLoan) {
    const formData = new FormData();
    formData.set("clientId", client.id);
    formData.set("unitId", unitId);
    await deactivateClientAction(formData);
  }

  async function handleReactivateClient(client: ClientWithLoan) {
    const formData = new FormData();
    formData.set("clientId", client.id);
    formData.set("unitId", unitId);
    await reactivateClientAction(formData);
  }

  function openEditClient(client: ClientWithLoan) {
    setActionsClient(null);
    setEditClient(client);
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

      {/* Frozen debt summary — visible only on Inactivos tab */}
      {filter === "inactivos" && inactivos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Inactivos</p>
            <p className="mt-0.5 text-lg font-bold leading-tight">{inactivos.length}</p>
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Congelados</p>
            <p className="mt-0.5 text-lg font-bold leading-tight">{congelados.length}</p>
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 px-3 py-2.5 text-center">
            <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Deuda congelada</p>
            <p className="mt-0.5 text-sm font-bold leading-tight text-amber-700 dark:text-amber-400">
              {formatCurrency(totalSaldoCongelado)}
            </p>
          </div>
        </div>
      )}

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
              today={today}
              onOpenActions={() => setActionsClient(client)}
            />
          ))
        )}
      </div>

      {/* Quick actions modal */}
      <ClientActionsModal
        open={actionsClient !== null}
        client={lastActionsClient.current}
        today={today}
        onClose={() => setActionsClient(null)}
        onPaymentHistory={() => lastActionsClient.current && openPaymentHistory(lastActionsClient.current)}
        onLoanHistory={() => lastActionsClient.current && openLoanHistory(lastActionsClient.current)}
        onCancelLoan={() => lastActionsClient.current && handleCancelLoan(lastActionsClient.current)}
        onFreezeClientLoan={() => lastActionsClient.current && handleFreezeClientLoan(lastActionsClient.current)}
        onDeactivateClient={() => lastActionsClient.current && handleDeactivateClient(lastActionsClient.current)}
        onReactivateClient={() => lastActionsClient.current && handleReactivateClient(lastActionsClient.current)}
        onEditClient={() => lastActionsClient.current && openEditClient(lastActionsClient.current)}
      />

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
        client={lastHistoryModal.current?.client ?? null}
        loading={historyLoading}
        data={historyData}
        onClose={() => { setHistoryModal(null); setHistoryData([]); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoanProgress — circular SVG progress ring
// ---------------------------------------------------------------------------

function LoanProgress({
  value,
  paid,
  total,
  size = 52
}: {
  value: number;
  paid: number;
  total: number;
  size?: number;
}) {
  const strokeWidth = size <= 40 ? 3 : 4;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - value / 100);
  const fontSize = size <= 40 ? "text-[9px]" : "text-[10px]";
  const subFontSize = size <= 40 ? "text-[8px]" : "text-[9px]";

  return (
    <div className="shrink-0 flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-muted" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="stroke-primary transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold leading-none tabular-nums", fontSize)}>{value}%</span>
        </div>
      </div>
      <p className={cn("text-muted-foreground leading-none tabular-nums", subFontSize)}>
        {paid}/{total}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClientCard
// ---------------------------------------------------------------------------

function ClientCard({
  client,
  today,
  onOpenActions
}: {
  client: ClientWithLoan;
  today: string;
  onOpenActions: () => void;
}) {
  const loan = client.loan;
  const isFrozen = !client.activo && loan?.estado === "congelado";

  const statusBadge =
    client.activo && loan?.estado === "activo"
      ? { label: "Activo", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" }
      : client.activo
      ? { label: "Disponible", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" }
      : isFrozen
      ? { label: "Congelado", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" }
      : { label: "Inactivo", cls: "bg-muted text-muted-foreground" };

  const progress = loan
    ? Math.min(100, Math.round((loan.cuotas_pagadas / loan.numero_cuotas) * 100))
    : 0;

  const diasAtraso =
    loan && loan.estado === "activo" && loan.cuotas_pagadas < loan.numero_cuotas
      ? calcDiasAtraso(today, loan.ultima_cuota_fecha)
      : 0;

  return (
    <button
      type="button"
      onClick={onOpenActions}
      className="w-full text-left rounded-2xl border bg-background p-4 shadow-sm space-y-3 transition-all duration-150 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight">{toTitleCase(client.alias)}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusBadge.cls)}>
              {statusBadge.label}
            </span>
          </div>
          {client.nit ? (
            <p className="mt-0.5 text-xs text-muted-foreground">NIT: {client.nit}</p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" />
      </div>

      {loan ? (
        <div className={cn(
          "rounded-xl p-3 space-y-2",
          isFrozen
            ? "bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30"
            : "bg-muted/40"
        )}>
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
              {loan.modalidad} · {loan.interes}%
            </span>
            {isFrozen && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <Snowflake className="h-3 w-3" />
                Congelado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={cn("text-lg font-bold leading-tight", diasAtraso > 0 ? "text-red-600 dark:text-red-400" : "")}>
                  {formatCurrency(loan.saldo)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Por cuota</p>
                <p className="font-semibold">{formatCurrency(loan.valor_cuota)}</p>
              </div>
            </div>
            <LoanProgress
              value={progress}
              paid={loan.cuotas_pagadas}
              total={loan.numero_cuotas}
            />
          </div>

          {diasAtraso > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-200/60 dark:border-red-700/30 bg-red-50 dark:bg-red-900/10 px-2.5 py-1.5">
              <Clock className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                {diasAtraso} {diasAtraso === 1 ? "día" : "días"} de atraso
              </span>
            </div>
          )}
        </div>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ClientActionsModal
// ---------------------------------------------------------------------------

type ConfirmView = "details" | "delete-loan" | "freeze" | "deactivate" | "reactivate" | null;

function ClientActionsModal({
  open,
  client,
  today,
  onClose,
  onPaymentHistory,
  onLoanHistory,
  onCancelLoan,
  onFreezeClientLoan,
  onDeactivateClient,
  onReactivateClient,
  onEditClient
}: {
  open: boolean;
  client: ClientWithLoan | null;
  today: string;
  onClose: () => void;
  onPaymentHistory: () => void;
  onLoanHistory: () => void;
  onCancelLoan: () => void;
  onFreezeClientLoan: () => void;
  onDeactivateClient: () => void;
  onReactivateClient: () => void;
  onEditClient: () => void;
}) {
  const [confirming, setConfirming] = useState<ConfirmView>(null);
  const [pending, setPending] = useState(false);

  const loan = client?.loan ?? null;

  function handleClose() {
    setConfirming(null);
    setPending(false);
    onClose();
  }

  async function handleConfirmDeleteLoan() {
    setPending(true);
    await onCancelLoan();
  }

  async function handleConfirmFreeze() {
    setPending(true);
    await onFreezeClientLoan();
  }

  async function handleConfirmDeactivate() {
    setPending(true);
    await onDeactivateClient();
  }

  async function handleConfirmReactivate() {
    setPending(true);
    await onReactivateClient();
  }

  const statusBadge = client
    ? client.activo && loan?.estado === "activo"
      ? { label: "Activo", cls: "bg-green-100 text-green-800" }
      : client.activo
      ? { label: "Disponible", cls: "bg-blue-100 text-blue-800" }
      : loan?.estado === "congelado"
      ? { label: "Congelado", cls: "bg-amber-100 text-amber-800" }
      : { label: "Inactivo", cls: "bg-muted text-muted-foreground" }
    : null;

  const slideOverDescription = client && statusBadge ? (
    <span className="flex flex-wrap items-center gap-2">
      {client.nit ? <span>NIT: {client.nit}</span> : null}
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusBadge.cls)}>
        {statusBadge.label}
      </span>
    </span>
  ) : undefined;

  // — Details view —
  if (confirming === "details") {
    const phone = client?.telefono1 || client?.telefono2 || "";
    const hasPhone = phone.length > 0;
    const digitsOnly = (v: string) => v.replace(/\D/g, "");
    const wa = `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(
      `Hola ${client ? toTitleCase(client.alias) : ""}, te escribimos de DinoPay sobre tu préstamo.`
    )}`;
    const diasAtraso =
      loan && loan.estado === "activo" && loan.cuotas_pagadas < loan.numero_cuotas
        ? calcDiasAtraso(today, loan.ultima_cuota_fecha)
        : 0;
    const progress = loan
      ? Math.min(100, Math.round((loan.cuotas_pagadas / loan.numero_cuotas) * 100))
      : 0;

    return (
      <SlideOver
        open={open}
        onClose={handleClose}
        title="Detalles"
        description={slideOverDescription}
      >
        <div className="px-5 py-4 lg:px-7 space-y-5">
          {/* Días de atraso */}
          {diasAtraso > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/15 dark:border-red-700/30 px-4 py-3">
              <Clock className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                  {diasAtraso} {diasAtraso === 1 ? "día" : "días"} de atraso
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">
                  Próxima cuota vencida: {loan?.ultima_cuota_fecha}
                </p>
              </div>
            </div>
          )}

          {/* Loan info */}
          {loan && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Préstamo</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                    {loan.modalidad} · {loan.interes}%
                  </span>
                  {loan.fecha_inicio && (
                    <span className="text-xs text-muted-foreground">{loan.fecha_inicio}</span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-background overflow-hidden text-sm">
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital prestado</p>
                    <p className="font-bold text-base">{formatCurrency(Number(loan.valor_neto))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total a cobrar</p>
                    <p className="font-bold text-base">{formatCurrency(Number(loan.total_a_cobrar))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                    <p className={cn("font-bold text-base", diasAtraso > 0 ? "text-red-600 dark:text-red-400" : "")}>
                      {formatCurrency(Number(loan.saldo))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Por cuota</p>
                    <p className="font-semibold">{formatCurrency(Number(loan.valor_cuota))}</p>
                  </div>
                </div>
                <div className="border-t bg-muted/30 px-3 py-3 flex items-center gap-4">
                  <LoanProgress
                    value={progress}
                    paid={loan.cuotas_pagadas}
                    total={loan.numero_cuotas}
                    size={68}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">{progress}% completado</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.numero_cuotas - loan.cuotas_pagadas} cuota{loan.numero_cuotas - loan.cuotas_pagadas !== 1 ? "s" : ""} pendiente{loan.numero_cuotas - loan.cuotas_pagadas !== 1 ? "s" : ""}
                    </p>
                    {loan.ultima_cuota_fecha && (
                      <p className="text-xs text-muted-foreground">
                        Próxima: {loan.ultima_cuota_fecha}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contacto</p>

            <div className="rounded-xl border bg-background divide-y divide-border/50 overflow-hidden">
              {client?.nit && (
                <div className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">NIT</span>
                  <span className="font-medium">{client.nit}</span>
                </div>
              )}
              {client?.telefono1 && (
                <div className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span className="font-medium">{client.telefono1}</span>
                </div>
              )}
              {client?.telefono2 && (
                <div className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">Teléfono 2</span>
                  <span className="font-medium">{client.telefono2}</span>
                </div>
              )}
              {client?.direccion1 && (
                <div className="flex items-start justify-between gap-4 px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground shrink-0">Dirección</span>
                  <span className="font-medium text-right">{client.direccion1}</span>
                </div>
              )}
              {client?.barrio && (
                <div className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">Barrio</span>
                  <span className="font-medium">{client.barrio}</span>
                </div>
              )}
              {!client?.nit && !client?.telefono1 && !client?.telefono2 && !client?.direccion1 && !client?.barrio && (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">Sin información de contacto</p>
              )}
            </div>

            {hasPhone && (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${digitsOnly(phone)}`}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </a>
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="flex w-full items-center justify-center gap-2 h-10 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </SlideOver>
    );
  }

  // — Confirmation: Eliminar préstamo —
  if (confirming === "delete-loan") {
    return (
      <SlideOver
        open={open}
        onClose={handleClose}
        title="Eliminar préstamo"
        description={slideOverDescription}
      >
        <div className="px-5 py-5 lg:px-7 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <p className="font-bold text-base">¿Eliminar este préstamo?</p>
              <p className="text-sm text-muted-foreground mt-0.5">Esta acción no se puede deshacer</p>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive/80">Lo que pasará</p>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2">
                <span className="text-green-600 dark:text-green-400 shrink-0">↑</span>
                La caja recupera <strong>{formatCurrency(Number(loan?.valor_neto ?? 0))}</strong> (capital prestado)
              </li>
              <li className="flex gap-2">
                <span className="text-destructive shrink-0">↓</span>
                La cartera pierde el saldo de <strong>{formatCurrency(Number(loan?.saldo ?? 0))}</strong>
              </li>
              <li className="flex gap-2">
                <span className="text-muted-foreground shrink-0">•</span>
                El cliente queda disponible para un nuevo préstamo
              </li>
            </ul>
          </div>

          {loan ? (
            <div className="rounded-xl bg-muted/50 p-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Capital prestado</p>
                <p className="font-bold text-base">{formatCurrency(Number(loan.valor_neto))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                <p className="font-bold text-base">{formatCurrency(Number(loan.saldo))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modalidad</p>
                <p className="font-semibold capitalize">{loan.modalidad} · {loan.interes}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
                <p className="font-semibold">{loan.cuotas_pagadas}/{loan.numero_cuotas}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className="h-11 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteLoan}
              disabled={pending}
              className="h-11 rounded-xl bg-destructive text-sm font-bold text-white hover:bg-destructive/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {pending ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </SlideOver>
    );
  }

  // — Confirmation: Congelar préstamo y cliente —
  if (confirming === "freeze") {
    return (
      <SlideOver
        open={open}
        onClose={handleClose}
        title="Congelar préstamo"
        description={slideOverDescription}
      >
        <div className="px-5 py-5 lg:px-7 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <Snowflake className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-base">¿Congelar préstamo y cliente?</p>
              <p className="text-sm text-muted-foreground mt-0.5">El cliente pasará a inactivos</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Lo que pasará</p>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                El saldo de <strong>{formatCurrency(Number(loan?.saldo ?? 0))}</strong> queda congelado en la cartera
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                La caja <strong>no recibe nada</strong>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                Se puede reactivar el cliente después para retomar la deuda
              </li>
            </ul>
          </div>

          {loan ? (
            <div className="rounded-xl bg-muted/50 p-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Saldo a congelar</p>
                <p className="font-bold text-base">{formatCurrency(Number(loan.saldo))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modalidad</p>
                <p className="font-semibold capitalize">{loan.modalidad} · {loan.interes}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
                <p className="font-semibold">{loan.cuotas_pagadas}/{loan.numero_cuotas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Por cuota</p>
                <p className="font-semibold">{formatCurrency(Number(loan.valor_cuota))}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className="h-11 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmFreeze}
              disabled={pending}
              className="h-11 rounded-xl bg-amber-600 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Snowflake className="h-4 w-4" />
              )}
              {pending ? "Congelando…" : "Congelar"}
            </button>
          </div>
        </div>
      </SlideOver>
    );
  }

  // — Confirmation: Desactivar cliente (sin préstamo) —
  if (confirming === "deactivate") {
    return (
      <SlideOver
        open={open}
        onClose={handleClose}
        title="Desactivar cliente"
        description={slideOverDescription}
      >
        <div className="px-5 py-5 lg:px-7 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <UserMinus className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-base">¿Desactivar a {client ? toTitleCase(client.alias) : ""}?</p>
              <p className="text-sm text-muted-foreground mt-0.5">El cliente pasará a inactivos</p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                El cliente no tiene préstamo activo
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                La cartera y la caja no se ven afectadas
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">•</span>
                Quedará en la lista de clientes inactivos
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className="h-11 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmDeactivate}
              disabled={pending}
              className="h-11 rounded-xl bg-amber-600 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
              {pending ? "Desactivando…" : "Desactivar"}
            </button>
          </div>
        </div>
      </SlideOver>
    );
  }

  // — Confirmation: Reactivar cliente —
  if (confirming === "reactivate") {
    return (
      <SlideOver
        open={open}
        onClose={handleClose}
        title="Reactivar cliente"
        description={slideOverDescription}
      >
        <div className="px-5 py-5 lg:px-7 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
              <UserCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-bold text-base">¿Reactivar a {client ? toTitleCase(client.alias) : ""}?</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {loan ? "El cliente y su préstamo volverán a activos" : "El cliente volverá a la lista de disponibles"}
              </p>
            </div>
          </div>

          {loan ? (
            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">Lo que pasará</p>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  El préstamo congelado de <strong>{formatCurrency(Number(loan.saldo))}</strong> vuelve a la cartera activa
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  El cliente puede volver a realizar pagos
                </li>
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  El cliente volverá a la lista de disponibles
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  La cartera y la caja no se ven afectadas
                </li>
              </ul>
            </div>
          )}

          {loan ? (
            <div className="rounded-xl bg-muted/50 p-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Saldo a reactivar</p>
                <p className="font-bold text-base">{formatCurrency(Number(loan.saldo))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modalidad</p>
                <p className="font-semibold capitalize">{loan.modalidad} · {loan.interes}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
                <p className="font-semibold">{loan.cuotas_pagadas}/{loan.numero_cuotas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Por cuota</p>
                <p className="font-semibold">{formatCurrency(Number(loan.valor_cuota))}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className="h-11 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmReactivate}
              disabled={pending}
              className="h-11 rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              {pending ? "Reactivando…" : "Reactivar"}
            </button>
          </div>
        </div>
      </SlideOver>
    );
  }

  // — Vista principal: lista de acciones (context-aware) —
  type Action = {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    disabled: boolean;
    color: "default" | "amber" | "destructive" | "green";
  };

  let actions: Action[];

  if (!client?.activo) {
    // Inactive client
    actions = [
      { label: "Detalles", icon: Eye, onClick: () => setConfirming("details"), disabled: false, color: "default" },
      { label: "Reactivar cliente", icon: UserCheck, onClick: () => setConfirming("reactivate"), disabled: false, color: "green" },
      { label: "Historial de préstamos", icon: FileText, onClick: onLoanHistory, disabled: false, color: "default" },
      ...(loan ? [{ label: "Historial de pagos", icon: CreditCard, onClick: onPaymentHistory, disabled: false, color: "default" as const }] : []),
      { label: "Editar cliente", icon: Pencil, onClick: onEditClient, disabled: false, color: "default" }
    ];
  } else if (loan) {
    // Active client with active loan
    actions = [
      { label: "Detalles", icon: Eye, onClick: () => setConfirming("details"), disabled: false, color: "default" },
      { label: "Historial de pagos", icon: CreditCard, onClick: onPaymentHistory, disabled: false, color: "default" },
      { label: "Historial de préstamos", icon: FileText, onClick: onLoanHistory, disabled: false, color: "default" },
      { label: "Congelar préstamo y cliente", icon: Snowflake, onClick: () => setConfirming("freeze"), disabled: false, color: "amber" },
      { label: "Eliminar préstamo", icon: Trash2, onClick: () => setConfirming("delete-loan"), disabled: false, color: "destructive" },
      { label: "Editar cliente", icon: Pencil, onClick: onEditClient, disabled: false, color: "default" }
    ];
  } else {
    // Active client without loan
    actions = [
      { label: "Detalles", icon: Eye, onClick: () => setConfirming("details"), disabled: false, color: "default" },
      { label: "Historial de préstamos", icon: FileText, onClick: onLoanHistory, disabled: false, color: "default" },
      { label: "Desactivar cliente", icon: UserMinus, onClick: () => setConfirming("deactivate"), disabled: false, color: "amber" },
      { label: "Editar cliente", icon: Pencil, onClick: onEditClient, disabled: false, color: "default" }
    ];
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={client ? toTitleCase(client.alias) : ""}
      description={slideOverDescription}
    >
      <div className="p-4 lg:p-5 space-y-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          const isDestructive = action.color === "destructive";
          const isAmber = action.color === "amber";
          const isGreen = action.color === "green";
          return (
            <button
              key={i}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border border-transparent p-4 transition-all group",
                action.disabled
                  ? "opacity-40 cursor-not-allowed bg-muted/20"
                  : isDestructive
                  ? "bg-destructive/5 hover:bg-destructive/10 hover:border-destructive/20 text-destructive"
                  : isAmber
                  ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 hover:border-amber-200 dark:hover:border-amber-700 text-amber-700 dark:text-amber-400"
                  : isGreen
                  ? "bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700 text-green-700 dark:text-green-400"
                  : "bg-muted/30 hover:bg-muted/60 hover:border-border/50"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                isDestructive
                  ? "bg-destructive/10 text-destructive group-hover:bg-destructive/20"
                  : isAmber
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50"
                  : isGreen
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-900/50"
                  : "bg-primary/10 text-primary group-hover:bg-primary/20"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">{action.label}</span>
              {!action.disabled && (
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </SlideOver>
  );
}

// ---------------------------------------------------------------------------
// ClientHistoryModal
// ---------------------------------------------------------------------------

function ClientHistoryModal({
  open,
  type,
  client,
  loading,
  data,
  onClose
}: {
  open: boolean;
  type: "pagos" | "prestamos";
  client: ClientWithLoan | null;
  loading: boolean;
  data: unknown[];
  onClose: () => void;
}) {
  const title = type === "pagos" ? "Historial de pagos" : "Historial de préstamos";
  const name = client ? toTitleCase(client.alias) : "";
  const loan = client?.loan;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={title}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{name}</span>
          {loan && type === "pagos" ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
              {loan.modalidad} · {loan.interes}%
            </span>
          ) : null}
        </span>
      }
    >
      <div className="px-5 py-4 lg:px-7">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : type === "pagos" ? (
          <PaymentsList rows={data as PaymentRow[]} loan={loan ?? null} />
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

function PaymentsList({
  rows,
  loan
}: {
  rows: PaymentRow[];
  loan: ClientWithLoan["loan"] | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay pagos registrados
      </p>
    );
  }

  const total = rows.reduce((acc, r) => acc + Number(r.monto), 0);
  const cuotasTotales = rows.reduce((acc, r) => acc + r.numero_cuotas, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pagos</p>
          <p className="mt-0.5 text-lg font-bold leading-tight">{rows.length}</p>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cuotas</p>
          <p className="mt-0.5 text-lg font-bold leading-tight">{cuotasTotales}</p>
        </div>
        <div className="rounded-xl bg-primary/10 px-3 py-2.5 text-center">
          <p className="text-[10px] font-medium text-primary/80 uppercase tracking-wider">Total</p>
          <p className="mt-0.5 text-sm font-bold leading-tight text-primary">{formatCurrency(total)}</p>
        </div>
      </div>

      {loan ? (
        <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2.5">
          <p className="text-sm text-muted-foreground">Saldo pendiente</p>
          <p className="text-sm font-bold">{formatCurrency(Number(loan.saldo))}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                {rows.length - i}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{r.fecha_pago}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {r.metodo_pago} · {r.numero_cuotas} cuota{r.numero_cuotas !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-green-700 dark:text-green-400 shrink-0">
              {formatCurrency(Number(r.monto))}
            </p>
          </div>
        ))}
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

  const totalPrestado = rows.reduce((acc, r) => acc + Number(r.valor_neto), 0);
  const activos = rows.filter((r) => r.estado === "activo").length;

  function estadoBadge(estado: string) {
    if (estado === "activo") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (estado === "completado") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (estado === "congelado") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="mt-0.5 text-lg font-bold leading-tight">{rows.length}</p>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Activos</p>
          <p className="mt-0.5 text-lg font-bold leading-tight">{activos}</p>
        </div>
        <div className="rounded-xl bg-primary/10 px-3 py-2.5 text-center">
          <p className="text-[10px] font-medium text-primary/80 uppercase tracking-wider">Prestado</p>
          <p className="mt-0.5 text-sm font-bold leading-tight text-primary">{formatCurrency(totalPrestado)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r) => {
          const progress = Math.min(100, Math.round((r.cuotas_pagadas / r.numero_cuotas) * 100));
          const fecha = r.created_at.slice(0, 10);
          return (
            <div key={r.id} className="rounded-xl border bg-background p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize shrink-0", estadoBadge(r.estado))}>
                    {r.estado}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize truncate">
                    {r.modalidad} · {r.interes}%
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{fecha}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Prestado</p>
                    <p className="font-bold">{formatCurrency(Number(r.valor_neto))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Saldo</p>
                    <p className="font-bold">{formatCurrency(Number(r.saldo))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Por cuota</p>
                    <p className="font-semibold text-sm">{formatCurrency(Number(r.valor_cuota))}</p>
                  </div>
                </div>
                <LoanProgress
                  value={progress}
                  paid={r.cuotas_pagadas}
                  total={r.numero_cuotas}
                  size={44}
                />
              </div>
            </div>
          );
        })}
      </div>
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
      description={client ? toTitleCase(client.alias) : undefined}
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
