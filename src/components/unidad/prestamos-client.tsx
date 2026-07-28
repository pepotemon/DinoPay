"use client";

import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleSlash,
  FileText,
  History,
  Layers,
  Lock,
  MapPinned,
  MessageCircle,
  Phone,
  Receipt,
  Search,
  UserPen,
  WalletCards,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaymentInputs } from "@/components/unidad/payment-inputs";
import {
  markNoPayVisitResult,
  registerPaymentAction
} from "@/lib/actions/unidad/payments";
import { cn, formatCurrency } from "@/lib/utils";

export type ClientLoan = {
  id: string;
  client_id: string;
  valor_cuota: number;
  valor_neto: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  modalidad: string;
  interes: number;
  posicion: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ultima_cuota_fecha: string | null;
  created_at: string;
  clients: {
    alias: string;
    nit: string | null;
    direccion1: string | null;
    direccion2: string | null;
    barrio: string | null;
    telefono1: string | null;
    telefono2: string | null;
  } | null;
};

type PaymentHistory = {
  id: string;
  loan_id: string;
  monto: number;
  numero_cuotas: number;
  metodo_pago: string;
  fecha_pago: string;
  hora_registro: string;
};

type LoanHistory = {
  id: string;
  client_id: string;
  valor_neto: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  valor_cuota: number;
  interes: number;
  modalidad: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
};

type PaymentLoanContext = {
  id: string;
  valor_cuota: number;
  total_a_cobrar: number;
  saldo: number;
  numero_cuotas: number;
};

type Props = {
  loans: ClientLoan[];
  paidLoanIds: string[];
  noPayLoanIds: string[];
  paymentHistoryByLoan: Record<string, PaymentHistory[]>;
  loanHistoryByClient: Record<string, LoanHistory[]>;
  overdueByLoan: Record<string, number>;
  adelantadasByLoan: Record<string, number>;
  cobradoHoy: number;
  meta: number;
  totalSaldo: number;
};

type SheetState =
  | null
  | { view: "main"; loan: ClientLoan }
  | { view: "pay"; loan: ClientLoan }
  | {
      view: "pay-confirm";
      loan: ClientLoan;
      formData: FormData;
      monto: string;
      cuotas: string;
      metodo: string;
    }
  | { view: "nopay"; loan: ClientLoan }
  | { view: "nopay-confirm"; loan: ClientLoan; reason: string }
  | { view: "info-details"; loan: ClientLoan }
  | { view: "info-payments"; loan: PaymentLoanContext; clientLoan: ClientLoan }
  | { view: "info-loans"; loan: ClientLoan };

const noPayReasons = [
  "No estaba en casa",
  "No contesta",
  "Dice que paga mañana",
  "Sin dinero",
  "Dirección incorrecta",
  "Otro"
];

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCuotas(loan: ClientLoan): string {
  const pagadas = (loan.total_a_cobrar - loan.saldo) / loan.valor_cuota;
  const rounded = Math.round(pagadas * 10) / 10;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${display} / ${loan.numero_cuotas}`;
}

function whatsappHref(phone: string, alias: string) {
  const msg = encodeURIComponent(`Hola ${alias}, te escribo de DinoPay sobre tu prestamo.`);
  return `https://wa.me/${digitsOnly(phone)}?text=${msg}`;
}

function backView(sheet: Exclude<SheetState, null>): SheetState {
  switch (sheet.view) {
    case "pay":
    case "nopay":
    case "info-details":
    case "info-loans":
      return { view: "main", loan: sheet.loan };
    case "info-payments":
      return { view: "main", loan: sheet.clientLoan };
    case "pay-confirm":
      return { view: "pay", loan: sheet.loan };
    case "nopay-confirm":
      return { view: "nopay", loan: sheet.loan };
    default:
      return null;
  }
}

function sheetSubtitle(view: Exclude<SheetState, null>["view"]) {
  switch (view) {
    case "pay":
    case "pay-confirm":
      return "Registrar pago";
    case "nopay":
    case "nopay-confirm":
      return "Sin pago hoy";
    case "info-details":
      return "Información detallada";
    case "info-payments":
      return "Pagos";
    case "info-loans":
      return "Historial";
    default:
      return null;
  }
}

export function PrestamosClient({
  loans,
  paidLoanIds,
  noPayLoanIds,
  paymentHistoryByLoan,
  loanHistoryByClient,
  overdueByLoan,
  adelantadasByLoan,
  cobradoHoy,
  meta
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pendientes" | "visitados">("pendientes");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [, startTransition] = useTransition();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const paidSet = useMemo(() => new Set(paidLoanIds), [paidLoanIds]);
  const noPaySet = useMemo(() => new Set(noPayLoanIds), [noPayLoanIds]);
  const visitedSet = useMemo(
    () => new Set([...paidLoanIds, ...noPayLoanIds]),
    [paidLoanIds, noPayLoanIds]
  );

  const progreso = meta > 0 ? Math.min(Math.round((cobradoHoy / meta) * 100), 100) : 0;
  const pendingCount = loans.filter((l) => !visitedSet.has(l.id)).length;

  const filtered = useMemo(
    () =>
      loans.filter((loan) => {
        const matchesFilter =
          (filter === "pendientes" && !visitedSet.has(loan.id)) ||
          (filter === "visitados" && visitedSet.has(loan.id));
        const q = search.toLowerCase();
        const searchable = [loan.clients?.alias, loan.clients?.barrio, loan.clients?.telefono1]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return matchesFilter && (!q || searchable.includes(q));
      }),
    [loans, filter, visitedSet, search]
  );

  function handlePayment(loanId: string, formData: FormData) {
    setSubmittingId(loanId);
    startTransition(async () => {
      const result = await registerPaymentAction({ ok: false, message: "" }, formData);
      setSubmittingId(null);
      if (result.ok) {
        setSheet(null);
        toast.success("Pago registrado");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleNoPay(loanId: string, nota: string) {
    setSubmittingId(loanId);
    startTransition(async () => {
      const result = await markNoPayVisitResult(loanId, nota);
      setSubmittingId(null);
      if (result.ok) {
        setSheet(null);
        toast.success("Marcado sin pago");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      {/* ── Cabecera sticky ── */}
      <div className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto max-w-md space-y-3 px-4 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                DinoPay
              </p>
              <h1 className="text-2xl font-black leading-tight">Cuotas del Día</h1>
            </div>
            <Link
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted"
              href="/unidad/enrutar"
            >
              <MapPinned className="h-4 w-4" />
              Enrutar
            </Link>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-black text-primary">{formatCurrency(cobradoHoy)}</span>
            <span className="text-muted-foreground">cobrado</span>
            <span className="text-border">·</span>
            <span className="font-black">{formatCurrency(meta)}</span>
            <span className="text-muted-foreground">meta</span>
            <span className="text-border">·</span>
            <span className="font-black">{progreso}%</span>
            <span className="text-muted-foreground">del día</span>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progreso}%` }}
            />
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-xl bg-muted/60 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, barrio o teléfono…"
              type="search"
              value={search}
            />
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-muted p-0.5">
            <button
              className={cn(
                "h-8 rounded-lg text-xs font-black transition-colors",
                filter === "pendientes"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setFilter("pendientes")}
              type="button"
            >
              Pendientes ({pendingCount})
            </button>
            <button
              className={cn(
                "h-8 rounded-lg text-xs font-black transition-colors",
                filter === "visitados"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setFilter("visitados")}
              type="button"
            >
              Visitados ({visitedSet.size})
            </button>
          </div>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="mx-auto w-full max-w-md divide-y px-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {loans.length === 0
              ? "No hay préstamos activos. Crea uno desde Nuevo."
              : "Sin resultados para este filtro."}
          </p>
        ) : (
          filtered.map((loan) => {
            const isPaid = paidSet.has(loan.id);
            const isNoPay = noPaySet.has(loan.id) && !isPaid;
            const isVisited = isPaid || isNoPay;
            const name = loan.clients?.alias ?? "Sin nombre";
            const overdue = overdueByLoan[loan.id] ?? 0;
            const adelantadas = adelantadasByLoan[loan.id] ?? 0;

            return (
              <button
                className="flex w-full items-center gap-3.5 py-4 text-left transition-colors active:bg-muted/50"
                key={loan.id}
                onClick={() => setSheet({ view: "main", loan })}
                type="button"
              >
                <span
                  className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    isPaid
                      ? "bg-primary"
                      : isNoPay
                        ? "bg-destructive"
                        : overdue > 0
                          ? "bg-orange-500"
                          : adelantadas > 0
                            ? "bg-green-500"
                            : "bg-border"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "truncate font-black",
                        isVisited && "text-muted-foreground"
                      )}
                    >
                      {name}
                    </p>
                    {overdue > 0 && !isVisited ? (
                      <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-black text-orange-600">
                        {overdue}d atraso
                      </span>
                    ) : adelantadas > 0 && !isVisited ? (
                      <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-black text-green-600">
                        {adelantadas} adelantada{adelantadas > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[loan.clients?.barrio, `${formatCuotas(loan)} cuotas`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p
                    className={cn(
                      "text-sm font-black",
                      isPaid
                        ? "text-primary"
                        : isNoPay
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                    )}
                  >
                    {formatCurrency(Number(loan.valor_cuota))}
                  </p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Bottom sheet ── */}
      {sheet ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setSheet(null)}
            type="button"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-background shadow-2xl">
            <div className="mx-auto max-w-md">
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              <div className="flex items-center gap-2 px-5 py-3">
                {sheet.view !== "main" ? (
                  <button
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
                    onClick={() => setSheet(backView(sheet))}
                    type="button"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                ) : null}
                <div className="min-w-0 flex-1">
                  {sheet.view === "info-loans" ? (
                    <>
                      <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Historial de préstamos de
                      </p>
                      <p className="truncate text-center text-2xl font-black leading-tight">
                        {(sheet.loan as ClientLoan).clients?.alias ?? "Sin nombre"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="truncate text-xl font-black">
                        {sheet.view === "info-payments"
                          ? (sheet.clientLoan.clients?.alias ?? "Sin nombre")
                          : ((sheet.loan as ClientLoan).clients?.alias ?? "Sin nombre")}
                      </p>
                      {sheetSubtitle(sheet.view) ? (
                        <p className="text-xs font-bold text-muted-foreground">
                          {sheetSubtitle(sheet.view)}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <button
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
                  onClick={() => setSheet(null)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="pb-8">
                {sheet.view === "main" ? (
                  <SheetMain
                    isPaid={paidSet.has(sheet.loan.id)}
                    isNoPay={noPaySet.has(sheet.loan.id) && !paidSet.has(sheet.loan.id)}
                    loan={sheet.loan}
                    onSetSheet={setSheet}
                  />
                ) : sheet.view === "pay" ? (
                  <SheetPay loan={sheet.loan} onSetSheet={setSheet} />
                ) : sheet.view === "pay-confirm" ? (
                  <SheetPayConfirm
                    cuotas={sheet.cuotas}
                    isPending={submittingId === sheet.loan.id}
                    loan={sheet.loan}
                    metodo={sheet.metodo}
                    monto={sheet.monto}
                    onBack={() => setSheet(backView(sheet))}
                    onConfirm={() => handlePayment(sheet.loan.id, sheet.formData)}
                  />
                ) : sheet.view === "nopay" ? (
                  <SheetNoPay loan={sheet.loan} onSetSheet={setSheet} />
                ) : sheet.view === "nopay-confirm" ? (
                  <SheetNoPayConfirm
                    isPending={submittingId === sheet.loan.id}
                    onBack={() => setSheet(backView(sheet))}
                    onConfirm={() => handleNoPay(sheet.loan.id, sheet.reason)}
                    reason={sheet.reason}
                  />
                ) : sheet.view === "info-details" ? (
                  <SheetInfoDetails
                    lastPayment={paymentHistoryByLoan[sheet.loan.id]?.[0] ?? null}
                    loan={sheet.loan}
                  />
                ) : sheet.view === "info-payments" ? (
                  <SheetInfoPayments
                    loan={sheet.loan}
                    payments={paymentHistoryByLoan[sheet.loan.id] ?? []}
                  />

                ) : sheet.view === "info-loans" ? (
                  <SheetInfoLoans
                    activeLoan={sheet.loan}
                    loans={loanHistoryByClient[sheet.loan.client_id] ?? []}
                    overdue={overdueByLoan[sheet.loan.id] ?? 0}
                    paymentHistoryByLoan={paymentHistoryByLoan}
                    onViewPayments={(loan) =>
                      setSheet({ view: "info-payments", loan, clientLoan: sheet.loan })
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SheetMain({
  isPaid,
  isNoPay,
  loan,
  onSetSheet
}: {
  isPaid: boolean;
  isNoPay: boolean;
  loan: ClientLoan;
  onSetSheet: (state: SheetState) => void;
}) {
  const client = loan.clients;
  const phone = client?.telefono1 || client?.telefono2 || "";
  const hasPhone = digitsOnly(phone).length > 0;
  const clientName = client?.alias ?? "Sin nombre";
  const address = [client?.direccion1, client?.barrio].filter(Boolean).join(", ");
  const isVisited = isPaid || isNoPay;

  return (
    <div className="space-y-4 px-5">
      {address ? <p className="text-sm text-muted-foreground">{address}</p> : null}

      {isPaid ? (
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          Pago registrado hoy
        </span>
      ) : isNoPay ? (
        <span className="inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
          No pagó hoy
        </span>
      ) : null}

      <div className="grid grid-cols-3 rounded-2xl bg-muted p-4 text-center">
        <SheetStat highlight label="Cuota" value={formatCurrency(Number(loan.valor_cuota))} />
        <SheetStat label="Saldo" value={formatCurrency(Number(loan.saldo))} />
        <SheetStat label="Cuotas" value={formatCuotas(loan)} />
      </div>

      {hasPhone ? (
        <div className="grid grid-cols-2 gap-3">
          <a
            className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
            href={`tel:${digitsOnly(phone)}`}
          >
            <Phone className="h-4 w-4" />
            Llamar
          </a>
          <a
            className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
            href={whatsappHref(phone, clientName)}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
            WhatsApp
          </a>
        </div>
      ) : null}

      {isVisited ? (
        <Button
          className="h-12 w-full rounded-2xl font-black shadow-lg shadow-primary/25"
          onClick={() => onSetSheet({ view: "pay", loan })}
          type="button"
        >
          <WalletCards className="h-5 w-5" />
          Registrar otro pago
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-12 rounded-2xl border border-destructive/20 bg-destructive/10 font-black text-destructive hover:bg-destructive/15"
            onClick={() => onSetSheet({ view: "nopay", loan })}
            type="button"
            variant="secondary"
          >
            <CircleSlash className="h-5 w-5" />
            No Pago
          </Button>
          <Button
            className="h-12 rounded-2xl font-black shadow-lg shadow-primary/25"
            onClick={() => onSetSheet({ view: "pay", loan })}
            type="button"
          >
            <WalletCards className="h-5 w-5" />
            Pagar
          </Button>
        </div>
      )}

      <div className="space-y-0.5 border-t pt-2">
        <SheetAction
          icon={<FileText className="h-5 w-5" />}
          label="Ver Detalles"
          onClick={() => onSetSheet({ view: "info-details", loan })}
        />
        <SheetAction
          icon={<WalletCards className="h-5 w-5" />}
          label="Historial de Pagos"
          onClick={() => onSetSheet({ view: "info-payments", loan, clientLoan: loan })}
        />
        <SheetAction
          icon={<History className="h-5 w-5" />}
          label="Historial de Préstamos"
          onClick={() => onSetSheet({ view: "info-loans", loan })}
        />
        <SheetAction
          href={`/unidad/prestamos/${loan.id}/editar-cliente`}
          icon={<UserPen className="h-5 w-5" />}
          label="Editar Cliente"
        />
      </div>
    </div>
  );
}

function SheetPay({
  loan,
  onSetSheet
}: {
  loan: ClientLoan;
  onSetSheet: (state: SheetState) => void;
}) {
  return (
    <form
      className="space-y-4 px-5"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSetSheet({
          view: "pay-confirm",
          loan,
          formData,
          monto: String(formData.get("monto") ?? "0"),
          cuotas: String(formData.get("numeroCuotas") ?? "1"),
          metodo: String(formData.get("metodoPago") ?? "")
        });
      }}
    >
      <input name="loanId" type="hidden" value={loan.id} />
      <PaymentInputs
        maxCuotas={Math.max(loan.numero_cuotas - loan.cuotas_pagadas, 1)}
        valorCuota={Number(loan.valor_cuota)}
      />
    </form>
  );
}

function SheetPayConfirm({
  cuotas,
  isPending,
  loan,
  metodo,
  monto,
  onBack,
  onConfirm
}: {
  cuotas: string;
  isPending: boolean;
  loan: ClientLoan;
  metodo: string;
  monto: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const montoNum = Number(monto);
  const esPartial = montoNum < loan.valor_cuota;
  const cuotasCompletas = Math.floor(montoNum / loan.valor_cuota);

  return (
    <div className="space-y-5 px-5">
      <div
        className={cn(
          "rounded-2xl p-5 text-center",
          esPartial ? "bg-orange-500/10" : "bg-primary/10"
        )}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {esPartial ? "Pago parcial" : "Vas a registrar"}
        </p>
        <p className={cn("mt-2 text-4xl font-black", esPartial ? "text-orange-600" : "text-primary")}>
          {formatCurrency(montoNum)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {esPartial
            ? `No cubre una cuota completa · ${metodo}`
            : `${cuotasCompletas} cuota(s) · ${metodo}`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-14 rounded-2xl font-black"
          disabled={isPending}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          Volver
        </Button>
        <Button
          className="h-14 rounded-2xl font-black shadow-lg shadow-primary/20"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? "Guardando…" : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}

function SheetNoPay({
  loan,
  onSetSheet
}: {
  loan: ClientLoan;
  onSetSheet: (state: SheetState) => void;
}) {
  const [reason, setReason] = useState(noPayReasons[0]);

  return (
    <div className="space-y-4 px-5">
      <label className="block space-y-2">
        <span className="text-sm font-bold">Razón</span>
        <div className="relative">
          <select
            className="h-12 w-full appearance-none rounded-xl bg-destructive/10 px-4 pr-10 text-sm font-medium outline-none"
            onChange={(e) => setReason(e.target.value)}
            value={reason}
          >
            {noPayReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-muted-foreground" />
        </div>
      </label>
      <Button
        className="h-12 w-full rounded-2xl font-black"
        onClick={() => onSetSheet({ view: "nopay-confirm", loan, reason })}
        type="button"
      >
        Continuar
      </Button>
    </div>
  );
}

function SheetNoPayConfirm({
  isPending,
  onBack,
  onConfirm,
  reason
}: {
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
  reason: string;
}) {
  return (
    <div className="space-y-5 px-5">
      <div className="rounded-2xl bg-destructive/10 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo</p>
        <p className="mt-2 text-xl font-black text-destructive">{reason}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-14 rounded-2xl font-black"
          disabled={isPending}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          Volver
        </Button>
        <Button
          className="h-14 rounded-2xl bg-destructive font-black text-destructive-foreground hover:bg-destructive/90"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? "Guardando…" : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}

function SheetInfoDetails({
  lastPayment,
  loan
}: {
  lastPayment: PaymentHistory | null;
  loan: ClientLoan;
}) {
  const client = loan.clients;

  return (
    <div className="space-y-5 px-5">
      <section>
        <p className="mb-2 text-sm font-black text-primary">Detalles del cliente</p>
        <div className="overflow-hidden rounded-2xl border divide-y">
          <DetailRow label="Dirección 1" value={client?.direccion1} />
          <DetailRow label="Dirección 2" value={client?.direccion2} />
          <DetailRow label="Teléfono 1" value={client?.telefono1} />
          <DetailRow label="Barrio" value={client?.barrio} />
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-black text-primary">Detalles del préstamo</p>
        <div className="overflow-hidden rounded-2xl border divide-y">
          <DetailRow label="Modalidad" value={loan.modalidad.charAt(0).toUpperCase() + loan.modalidad.slice(1)} />
          <DetailRow label="Interés" value={`${loan.interes}%`} />
          <DetailRow label="Cuotas pagadas" value={formatCuotas(loan)} />
          <DetailRow label="Fecha de cuota" value={loan.ultima_cuota_fecha} />
          <DetailRow label="Último pago" value={lastPayment?.fecha_pago} />
          <DetailRow label="Fecha de inicio" value={loan.fecha_inicio} />
          <DetailRow label="Fecha de fin" value={loan.fecha_fin} />
          <DetailRow label="Fecha de creación" value={loan.created_at.slice(0, 10)} />
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-black">{value ?? "—"}</span>
    </div>
  );
}

function fmtCuotaNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace(".", ",");
}

function SheetInfoPayments({
  loan,
  payments
}: {
  loan: PaymentLoanContext;
  payments: PaymentHistory[];
}) {
  const totalPagado = loan.total_a_cobrar - loan.saldo;
  const cuotasFrac = totalPagado / loan.valor_cuota;
  const nextWhole = Math.ceil(cuotasFrac);
  const faltaMonto =
    nextWhole > cuotasFrac && cuotasFrac > 0
      ? (nextWhole - cuotasFrac) * loan.valor_cuota
      : 0;

  // Cuota acumulada por pago (más reciente primero)
  let running = cuotasFrac;
  const paymentsTagged = payments.map((p) => {
    const tag = running;
    running = running - p.monto / loan.valor_cuota;
    return { ...p, cuotaTag: tag };
  });

  return (
    <div className="space-y-4 px-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-primary/25 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-primary">
            <Banknote className="h-4 w-4" />
            Total Pagado
          </div>
          <p className="text-2xl font-black">{formatCurrency(totalPagado)}</p>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Lock className="h-4 w-4" />
            Saldo
          </div>
          <p className="text-2xl font-black">{formatCurrency(Number(loan.saldo))}</p>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Layers className="h-4 w-4" />
            Cuotas Pagadas
          </div>
          <p className="text-2xl font-black">{fmtCuotaNum(cuotasFrac)}</p>
          {faltaMonto > 0.01 ? (
            <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
              Faltan{" "}
              <span className="font-black text-primary">{formatCurrency(faltaMonto)}</span>{" "}
              para completar la cuota{" "}
              <span className="font-black text-primary">#{nextWhole}</span>
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Receipt className="h-4 w-4" />
            Pagos Realizados
          </div>
          <p className="text-2xl font-black">{payments.length}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="rounded-2xl border p-5 text-sm text-muted-foreground">
          Sin pagos registrados todavía.
        </p>
      ) : (
        <div className="space-y-3">
          {paymentsTagged.map((payment) => (
            <div className="rounded-2xl border p-4" key={payment.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted">
                    {payment.metodo_pago === "transferencia" ? (
                      <ArrowLeftRight className="h-4 w-4 text-primary" />
                    ) : (
                      <Banknote className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-black capitalize">{payment.metodo_pago}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.fecha_pago} {payment.hora_registro}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Cuotas pagadas: {payment.numero_cuotas}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-primary">#{fmtCuotaNum(payment.cuotaTag)}</p>
                  <p className="text-lg font-black">{formatCurrency(Number(payment.monto))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateNice(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function LoanCard({
  loan,
  payments,
  overdueActiveDays,
  isActive,
  onViewPayments
}: {
  loan: ClientLoan | LoanHistory;
  payments: PaymentHistory[];
  overdueActiveDays?: number;
  isActive: boolean;
  onViewPayments: () => void;
}) {
  const cuotasFrac = (loan.total_a_cobrar - loan.saldo) / loan.valor_cuota;

  // Cuotas parciales = pagos donde monto < valor_cuota
  const cuotasParciales = payments.filter(
    (p) => Number(p.monto) < Number(loan.valor_cuota) - 0.01
  ).length;

  // Días de atraso al completar (para préstamos completados)
  let diasAtrasoAlCompletar = 0;
  if (!isActive && loan.fecha_fin && payments.length > 0) {
    const lastPaymentDate = new Date(payments[0].fecha_pago + "T00:00:00");
    const fechaFin = new Date(loan.fecha_fin + "T00:00:00");
    const diff = Math.round((lastPaymentDate.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24));
    diasAtrasoAlCompletar = Math.max(0, diff);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3">
        <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-snug">
          Préstamo realizado entre el{" "}
          <span className="font-black">{formatDateNice(loan.fecha_inicio)}</span>{" "}
          y{" "}
          <span className="font-black">{formatDateNice(loan.fecha_fin)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Valor Total</p>
          <p className="mt-1 text-xl font-black text-primary">
            {formatCurrency(Number(loan.total_a_cobrar))}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Valor Neto</p>
          <p className="mt-1 text-xl font-black text-primary">
            {formatCurrency(Number(loan.valor_neto))}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Intereses</p>
          <p className="mt-1 text-xl font-black text-primary">{loan.interes}%</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Valor Cuota</p>
          <p className="mt-1 text-xl font-black text-primary">
            {formatCurrency(Number(loan.valor_cuota))}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <p className="mb-3 font-black">Resumen</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
            Cuotas parciales: {cuotasParciales}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
            Modalidad:{" "}
            {loan.modalidad.charAt(0).toUpperCase() + loan.modalidad.slice(1)}
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
            Cantidad de cuotas: {loan.numero_cuotas}
          </li>
          {isActive && (overdueActiveDays ?? 0) > 0 ? (
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span>
                El cliente lleva{" "}
                <span className="font-black text-destructive">{overdueActiveDays} días de atraso</span>
              </span>
            </li>
          ) : null}
          {!isActive && diasAtrasoAlCompletar > 0 ? (
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <span>
                El cliente pagó su préstamo con{" "}
                <span className="font-black text-destructive">
                  {diasAtrasoAlCompletar} días de atraso
                </span>
              </span>
            </li>
          ) : null}
        </ul>
      </div>

      <Button
        className="h-12 w-full rounded-2xl font-black shadow-lg shadow-primary/20"
        onClick={onViewPayments}
        type="button"
      >
        Ver Pagos
      </Button>
    </div>
  );
}

function SheetInfoLoans({
  activeLoan,
  loans,
  overdue,
  paymentHistoryByLoan,
  onViewPayments
}: {
  activeLoan: ClientLoan;
  loans: LoanHistory[];
  overdue: number;
  paymentHistoryByLoan: Record<string, PaymentHistory[]>;
  onViewPayments: (loan: PaymentLoanContext) => void;
}) {
  const previousLoans = loans.filter((l) => l.id !== activeLoan.id);

  return (
    <div className="space-y-5 px-5">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <p className="font-black">Detalles del Préstamo</p>
        </div>
        <LoanCard
          isActive
          loan={activeLoan}
          overdueActiveDays={overdue}
          payments={paymentHistoryByLoan[activeLoan.id] ?? []}
          onViewPayments={() => onViewPayments(activeLoan)}
        />
      </section>

      {previousLoans.length > 0 ? (
        <section className="space-y-5">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Préstamos anteriores
          </p>
          {previousLoans.map((loan) => (
            <div className="space-y-3" key={loan.id}>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <p className="font-black text-muted-foreground">
                  {formatDateNice(loan.fecha_inicio ?? loan.created_at.slice(0, 10))}
                </p>
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-black",
                    loan.estado === "completado"
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {loan.estado}
                </span>
              </div>
              <LoanCard
                isActive={false}
                loan={loan}
                payments={paymentHistoryByLoan[loan.id] ?? []}
                onViewPayments={() => onViewPayments(loan)}
              />
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function SheetStat({
  highlight,
  label,
  value
}: {
  highlight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-base font-black", highlight && "text-primary")}>{value}</p>
    </div>
  );
}

function SheetAction({
  href,
  icon,
  label,
  onClick
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const cls =
    "flex h-12 w-full items-center gap-3 rounded-xl px-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted active:bg-muted";

  if (href) {
    return (
      <Link className={cls} href={href}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button className={cls} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-black">{value}</p>
    </div>
  );
}
