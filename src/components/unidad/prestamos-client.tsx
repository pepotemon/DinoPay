"use client";

import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  CircleSlash,
  Copy,
  Download,
  FileText,
  History,
  Layers,
  Lock,
  MapPinned,
  MessageCircle,
  MoreVertical,
  Phone,
  Receipt,
  Search,
  Trash2,
  UserPen,
  WalletCards,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaymentInputs } from "@/components/unidad/payment-inputs";
import {
  deleteLoanResult,
  deletePaymentResult,
  markNoPayVisitResult,
  registerPaymentAction
} from "@/lib/actions/unidad/payments";
import { cn, formatCurrency } from "@/lib/utils";
import { dateInTimeZone } from "@/lib/utils/date-timezone";

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
    genero: string | null;
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
  countryCode: string | null;
  canDeleteLoans: boolean;
  canDeletePayments: boolean;
  today: string;
  zonaHoraria: string;
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
  | { view: "info-loans"; loan: ClientLoan }
  | { view: "receipt"; loan: ClientLoan }
  | {
      view: "delete-payment-confirm";
      loan: PaymentLoanContext;
      clientLoan: ClientLoan;
      payment: PaymentHistory;
    }
  | {
      view: "delete-loan-confirm";
      loan: ClientLoan | LoanHistory;
      clientLoan: ClientLoan;
    };

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

function clientInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "--";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function modalidadLabel(modalidad: string): string {
  return modalidad.charAt(0).toUpperCase() + modalidad.slice(1);
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
    case "receipt":
      return { view: "main", loan: sheet.loan };
    case "info-payments":
      return { view: "main", loan: sheet.clientLoan };
    case "delete-payment-confirm":
      return { view: "info-payments", loan: sheet.loan, clientLoan: sheet.clientLoan };
    case "delete-loan-confirm":
      return { view: "info-loans", loan: sheet.clientLoan };
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
    case "receipt":
      return "Recibo de pago";
    case "delete-payment-confirm":
      return "Confirmar anulacion";
    case "delete-loan-confirm":
      return "Confirmar eliminacion";
    default:
      return null;
  }
}

function sheetClientLoan(sheet: Exclude<SheetState, null>): ClientLoan {
  if ("clientLoan" in sheet) return sheet.clientLoan;
  return sheet.loan as ClientLoan;
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
  meta,
  countryCode,
  canDeleteLoans,
  canDeletePayments,
  today,
  zonaHoraria
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "pendientes" | "visitados">("pendientes");
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
  const visitedCount = visitedSet.size;

  const filtered = useMemo(
    () =>
      loans.filter((loan) => {
        const q = search.toLowerCase().trim();
        const searchable = [loan.clients?.alias, loan.clients?.barrio, loan.clients?.telefono1]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch = !q || searchable.includes(q);
        // When searching, ignore the active filter and show all matches
        if (q) return matchesSearch;
        const matchesFilter =
          filter === "todos" ||
          (filter === "pendientes" && !visitedSet.has(loan.id)) ||
          (filter === "visitados" && visitedSet.has(loan.id));
        return matchesFilter;
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

  function handleDeletePayment(paymentId: string) {
    setSubmittingId(paymentId);
    startTransition(async () => {
      const result = await deletePaymentResult(paymentId);
      setSubmittingId(null);
      if (result.ok) {
        setSheet(null);
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDeleteLoan(loanId: string) {
    setSubmittingId(loanId);
    startTransition(async () => {
      const result = await deleteLoanResult(loanId);
      setSubmittingId(null);
      if (result.ok) {
        setSheet(null);
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      {/* ── Cabecera sticky ── */}
      <div className="sticky top-0 z-40 -mx-4 border-b bg-background sm:mx-auto">
        <div className="mx-auto max-w-lg space-y-3 px-3 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Cuotas del Día
              </p>
              <h1 className="text-2xl font-black leading-tight">
                <span className="font-black text-primary">{visitedCount}</span>
                <span className="text-muted-foreground">/{loans.length}</span>
                <span className="ml-2 text-lg font-bold text-muted-foreground">visitados</span>
              </h1>
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

          <div className="grid grid-cols-3 rounded-xl bg-muted p-0.5">
            <button
              className={cn(
                "h-8 rounded-lg text-xs font-black transition-colors",
                filter === "todos"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
              onClick={() => setFilter("todos")}
              type="button"
            >
              Todos ({loans.length})
            </button>
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
              Visitados ({visitedCount})
            </button>
          </div>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="-mx-4 space-y-2 px-2.5 py-2.5 sm:mx-auto sm:max-w-lg">
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
              <LoanListCard
                adelantadas={adelantadas}
                isNoPay={isNoPay}
                isPaid={isPaid}
                isVisited={isVisited}
                key={loan.id}
                loan={loan}
                name={name}
                overdue={overdue}
                onMenu={() => setSheet({ view: "main", loan })}
                onNoPay={() => setSheet({ view: "nopay", loan })}
                onPay={() => setSheet({ view: "pay", loan })}
              />
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
          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-2xl bg-background shadow-2xl">
            <div className="mx-auto max-w-lg">
              <div className="flex justify-center pb-0.5 pt-2">
                <div className="h-1 w-8 rounded-full bg-border" />
              </div>

              <div className="relative px-3 pb-2 pt-1">
                {sheet.view !== "main" ? (
                  <button
                    className="absolute left-3 top-1 grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"
                    onClick={() => setSheet(backView(sheet))}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div className="mx-10 min-w-0 text-center">
                  {sheet.view !== "pay" && sheet.view !== "pay-confirm" ? (
                    <ClientDinoAvatar
                      genero={sheetClientLoan(sheet).clients?.genero}
                      name={sheetClientLoan(sheet).clients?.alias ?? "Cliente"}
                    />
                  ) : null}
                  {sheet.view === "info-loans" ? (
                    <>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Historial de préstamos de
                      </p>
                      <p className="truncate text-xl font-black uppercase leading-tight">
                        {(sheet.loan as ClientLoan).clients?.alias ?? "Sin nombre"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 truncate text-lg font-black leading-tight">
                        {sheet.view === "info-payments"
                          ? (sheet.clientLoan.clients?.alias ?? "Sin nombre")
                          : sheet.view === "delete-payment-confirm"
                            ? (sheet.clientLoan.clients?.alias ?? "Sin nombre")
                          : sheet.view === "delete-loan-confirm"
                            ? (sheet.clientLoan.clients?.alias ?? "Sin nombre")
                          : ((sheet.loan as ClientLoan).clients?.alias ?? "Sin nombre")}
                      </p>
                      {sheetSubtitle(sheet.view) ? (
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {sheetSubtitle(sheet.view)}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <button
                  className="absolute right-3 top-1 grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"
                  onClick={() => setSheet(null)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="pb-4">
                {sheet.view === "main" ? (
                  <SheetMain
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
                    zonaHoraria={zonaHoraria}
                  />
                ) : sheet.view === "info-payments" ? (
                  <SheetInfoPayments
                    canDeletePayments={canDeletePayments}
                    loan={sheet.loan}
                    onDeletePayment={(payment) =>
                      setSheet({
                        view: "delete-payment-confirm",
                        loan: sheet.loan,
                        clientLoan: sheet.clientLoan,
                        payment
                      })
                    }
                    payments={paymentHistoryByLoan[sheet.loan.id] ?? []}
                    today={today}
                    zonaHoraria={zonaHoraria}
                  />

                ) : sheet.view === "info-loans" ? (
                  <SheetInfoLoans
                    activeLoan={sheet.loan}
                    loans={loanHistoryByClient[sheet.loan.client_id] ?? []}
                    overdue={overdueByLoan[sheet.loan.id] ?? 0}
                    paymentHistoryByLoan={paymentHistoryByLoan}
                    canDeleteLoans={canDeleteLoans}
                    onDeleteLoan={(loan) =>
                      setSheet({ view: "delete-loan-confirm", loan, clientLoan: sheet.loan })
                    }
                    onViewPayments={(loan) =>
                      setSheet({ view: "info-payments", loan, clientLoan: sheet.loan })
                    }
                    today={today}
                    zonaHoraria={zonaHoraria}
                  />
                ) : sheet.view === "receipt" ? (
                  <SheetReceipt
                    countryCode={countryCode}
                    loan={sheet.loan}
                    payments={paymentHistoryByLoan[sheet.loan.id] ?? []}
                    zonaHoraria={zonaHoraria}
                  />
                ) : sheet.view === "delete-payment-confirm" ? (
                  <SheetDeletePaymentConfirm
                    isPending={submittingId === sheet.payment.id}
                    onBack={() => setSheet(backView(sheet))}
                    onConfirm={() => handleDeletePayment(sheet.payment.id)}
                    payment={sheet.payment}
                  />
                ) : sheet.view === "delete-loan-confirm" ? (
                  <SheetDeleteLoanConfirm
                    isPending={submittingId === sheet.loan.id}
                    loan={sheet.loan}
                    onBack={() => setSheet(backView(sheet))}
                    onConfirm={() => handleDeleteLoan(sheet.loan.id)}
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

function ClientDinoAvatar({
  genero,
  name
}: {
  genero: string | null | undefined;
  name: string;
}) {
  const normalized = genero?.toLowerCase();
  const src =
    normalized === "femenino"
      ? "/assets/client-avatars/dino-client-female.png"
      : normalized === "masculino"
        ? "/assets/client-avatars/dino-client-male.png"
        : "/assets/client-avatars/dino-client-neutral.png";

  return (
    <figure
      aria-label={`Avatar de ${name}`}
      className="relative mx-auto h-[74px] w-[74px] overflow-visible"
      role="img"
    >
      <Image
        alt=""
        className="object-contain"
        fill
        priority={false}
        sizes="74px"
        src={src}
      />
    </figure>
  );
}

function LoanListCard({
  adelantadas,
  isNoPay,
  isPaid,
  isVisited,
  loan,
  name,
  overdue,
  onMenu,
  onNoPay,
  onPay
}: {
  adelantadas: number;
  isNoPay: boolean;
  isPaid: boolean;
  isVisited: boolean;
  loan: ClientLoan;
  name: string;
  overdue: number;
  onMenu: () => void;
  onNoPay: () => void;
  onPay: () => void;
}) {
  const totalPagado = Number(loan.total_a_cobrar) - Number(loan.saldo);
  const showOverdue = overdue > 0 && !isVisited;
  const showAdvanced = adelantadas > 0 && !isVisited && !showOverdue;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-background p-2.5 shadow-sm transition-colors",
        isVisited && "bg-muted/20"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">
          {clientInitials(name)}
          {showOverdue ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="truncate text-base font-black leading-tight tracking-normal text-foreground">
              {name}
            </h2>
            {isPaid ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-black text-primary">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Visitado hoy
              </span>
            ) : null}
          </div>
          {showOverdue ? (
            <p className="mt-0.5 inline-flex rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-black text-destructive">
              {overdue} cuota{overdue !== 1 ? "s" : ""} - {overdue} dia{overdue !== 1 ? "s" : ""} atrasado{overdue !== 1 ? "s" : ""}
            </p>
          ) : showAdvanced ? (
            <p className="mt-0.5 inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-black text-primary">
              {adelantadas} adelantada{adelantadas > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={`Opciones de ${name}`}
            className="grid h-7 w-7 place-items-center rounded-full text-foreground transition-colors active:bg-muted"
            onClick={onMenu}
            type="button"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-2.5 py-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">Cuota</p>
          <p className="mt-0.5 text-xl font-black leading-none">
            {formatCurrency(Number(loan.valor_cuota))}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-black leading-none">{formatCuotas(loan)}</p>
          <p className="mt-0.5 inline-flex rounded-md bg-background px-1.5 py-0.5 text-[9px] font-black text-primary shadow-sm">
            {modalidadLabel(loan.modalidad)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 px-0.5 py-2 text-center">
        <CardMetric label="Saldo" value={formatCurrency(Number(loan.saldo))} />
        <CardMetric label="Prestamo" value={formatCurrency(Number(loan.total_a_cobrar))} />
        <CardMetric highlight label="Pagado" value={formatCurrency(totalPagado)} />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 text-xs font-black text-destructive shadow-sm transition active:scale-[0.99]",
            isNoPay && "bg-destructive/15"
          )}
          onClick={onNoPay}
          type="button"
        >
          <CircleSlash className="h-3.5 w-3.5" />
          No Pago
        </button>
        <button
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-black text-primary-foreground shadow-md shadow-primary/20 transition active:scale-[0.99]",
            isPaid && "opacity-80"
          )}
          onClick={onPay}
          type="button"
        >
          <Banknote className="h-3.5 w-3.5" />
          Pagar
        </button>
      </div>
    </article>
  );
}

function CardMetric({
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
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-xs font-black", highlight && "text-primary")}>{value}</p>
    </div>
  );
}

function SheetMain({
  loan,
  onSetSheet
}: {
  loan: ClientLoan;
  onSetSheet: (state: SheetState) => void;
}) {
  const client = loan.clients;
  const phone = client?.telefono1 || client?.telefono2 || "";
  const hasPhone = digitsOnly(phone).length > 0;
  const clientName = client?.alias ?? "Sin nombre";
  const address = [client?.direccion1, client?.barrio].filter(Boolean).join(", ");

  return (
    <div className="space-y-3 px-3">
      {address ? <p className="text-sm text-muted-foreground">{address}</p> : null}

      <div className="space-y-1 rounded-2xl bg-muted/60 p-2">
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
          label="Historial de Prestamos"
          onClick={() => onSetSheet({ view: "info-loans", loan })}
        />
        <SheetAction
          icon={<Receipt className="h-5 w-5" />}
          label="Copiar Recibo"
          onClick={() => onSetSheet({ view: "receipt", loan })}
        />
        <SheetAction
          href={`/unidad/prestamos/${loan.id}/editar-cliente`}
          icon={<UserPen className="h-5 w-5" />}
          label="Editar Cliente"
        />
        {hasPhone ? (
          <>
            <SheetAction
              href={`tel:${digitsOnly(phone)}`}
              icon={<Phone className="h-5 w-5" />}
              label="Llamar"
            />
            <SheetAction
              href={whatsappHref(phone, clientName)}
              icon={<MessageCircle className="h-5 w-5" />}
              label="WhatsApp"
            />
          </>
        ) : null}
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
      className="space-y-3 px-3"
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
    <div className="space-y-3 px-3">
      <div
        className={cn(
          "rounded-xl px-4 py-3 text-center",
          esPartial ? "bg-orange-500/10" : "bg-primary/10"
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {esPartial ? "Pago parcial" : "Vas a registrar"}
        </p>
        <p className={cn("mt-1 text-2xl font-black", esPartial ? "text-orange-600" : "text-primary")}>
          {formatCurrency(montoNum)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {esPartial
            ? `No cubre una cuota completa · ${metodo}`
            : `${cuotasCompletas} cuota(s) · ${metodo}`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-10 rounded-xl text-sm font-black"
          disabled={isPending}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          Volver
        </Button>
        <Button
          className="h-10 rounded-xl text-sm font-black shadow-md shadow-primary/20"
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
    <div className="space-y-3 px-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-bold">Razón</span>
        <div className="relative">
          <select
            className="h-10 w-full appearance-none rounded-xl bg-destructive/10 px-3 pr-9 text-sm font-medium outline-none"
            onChange={(e) => setReason(e.target.value)}
            value={reason}
          >
            {noPayReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
      </label>
      <Button
        className="h-10 w-full rounded-xl text-sm font-black"
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
    <div className="space-y-3 px-3">
      <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Motivo</p>
        <p className="mt-1 text-base font-black text-destructive">{reason}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-10 rounded-xl text-sm font-black"
          disabled={isPending}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          Volver
        </Button>
        <Button
          className="h-10 rounded-xl bg-destructive text-sm font-black text-destructive-foreground hover:bg-destructive/90"
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

function SheetDeletePaymentConfirm({
  isPending,
  onBack,
  onConfirm,
  payment
}: {
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
  payment: PaymentHistory;
}) {
  return (
    <div className="space-y-3 px-3">
      <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Vas a eliminar este abono
        </p>
        <p className="mt-1 text-2xl font-black text-destructive">
          {formatCurrency(Number(payment.monto))}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Se reversa el saldo y las cuotas del prestamo.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-10 rounded-xl text-sm font-black"
          disabled={isPending}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          Volver
        </Button>
        <Button
          className="h-10 rounded-xl bg-destructive text-sm font-black text-destructive-foreground hover:bg-destructive/90"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </div>
  );
}

function SheetDeleteLoanConfirm({
  isPending,
  loan,
  onBack,
  onConfirm
}: {
  isPending: boolean;
  loan: ClientLoan | LoanHistory;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3 px-3">
      <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Vas a eliminar este prestamo
        </p>
        <p className="mt-1 text-2xl font-black text-destructive">
          {formatCurrency(Number(loan.valor_neto))}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Solo se permite si fue creado hoy y no tiene abonos.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-10 rounded-xl text-sm font-black"
          disabled={isPending}
          onClick={onBack}
          type="button"
          variant="secondary"
        >
          Volver
        </Button>
        <Button
          className="h-10 rounded-xl bg-destructive text-sm font-black text-destructive-foreground hover:bg-destructive/90"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </div>
  );
}

function SheetInfoDetails({
  lastPayment,
  loan,
  zonaHoraria
}: {
  lastPayment: PaymentHistory | null;
  loan: ClientLoan;
  zonaHoraria: string;
}) {
  const client = loan.clients;

  return (
    <div className="space-y-3 px-3">
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
          <DetailRow label="Fecha de creación" value={dateInTimeZone(loan.created_at, zonaHoraria)} />
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
  canDeletePayments,
  loan,
  onDeletePayment,
  payments,
  today,
  zonaHoraria
}: {
  canDeletePayments: boolean;
  loan: PaymentLoanContext;
  onDeletePayment: (payment: PaymentHistory) => void;
  payments: PaymentHistory[];
  today: string;
  zonaHoraria: string;
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
    <div className="space-y-3 px-3">
      <div className="grid grid-cols-2 gap-2">
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
              {canDeletePayments && dateInTimeZone(payment.hora_registro, zonaHoraria) === today ? (
                <button
                  className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 text-xs font-black text-destructive"
                  onClick={() => onDeletePayment(payment)}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar abono
                </button>
              ) : null}
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
  canDeleteLoan,
  loan,
  payments,
  overdueActiveDays,
  isActive,
  onDeleteLoan,
  onViewPayments
}: {
  canDeleteLoan: boolean;
  loan: ClientLoan | LoanHistory;
  payments: PaymentHistory[];
  overdueActiveDays?: number;
  isActive: boolean;
  onDeleteLoan: (loan: ClientLoan | LoanHistory) => void;
  onViewPayments: () => void;
}) {
  const cuotasFrac = (loan.total_a_cobrar - loan.saldo) / loan.valor_cuota;
  const showDeleteLoan = canDeleteLoan && payments.length === 0;

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

      <div className="grid grid-cols-2 gap-2">
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

      <div className="grid gap-2">
        <Button
          className="h-12 w-full rounded-2xl font-black shadow-lg shadow-primary/20"
          onClick={onViewPayments}
          type="button"
        >
          Ver Pagos
        </Button>
        {showDeleteLoan ? (
          <button
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 text-xs font-black text-destructive"
            onClick={() => onDeleteLoan(loan)}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar prestamo
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SheetInfoLoans({
  activeLoan,
  canDeleteLoans,
  loans,
  overdue,
  onDeleteLoan,
  paymentHistoryByLoan,
  onViewPayments,
  today,
  zonaHoraria
}: {
  activeLoan: ClientLoan;
  canDeleteLoans: boolean;
  loans: LoanHistory[];
  overdue: number;
  onDeleteLoan: (loan: ClientLoan | LoanHistory) => void;
  paymentHistoryByLoan: Record<string, PaymentHistory[]>;
  onViewPayments: (loan: PaymentLoanContext) => void;
  today: string;
  zonaHoraria: string;
}) {
  const previousLoans = loans.filter((l) => l.id !== activeLoan.id);

  return (
    <div className="space-y-3 px-3">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <p className="font-black">Detalles del Préstamo</p>
        </div>
        <LoanCard
          canDeleteLoan={canDeleteLoans && dateInTimeZone(activeLoan.created_at, zonaHoraria) === today}
          isActive
          loan={activeLoan}
          overdueActiveDays={overdue}
          onDeleteLoan={onDeleteLoan}
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
                  {formatDateNice(loan.fecha_inicio ?? dateInTimeZone(loan.created_at, zonaHoraria))}
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
                canDeleteLoan={canDeleteLoans && dateInTimeZone(loan.created_at, zonaHoraria) === today}
                isActive={false}
                loan={loan}
                onDeleteLoan={onDeleteLoan}
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
    if (href.startsWith("http") || href.startsWith("tel:")) {
      return (
        <a
          className={cls}
          href={href}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          target={href.startsWith("http") ? "_blank" : undefined}
        >
          {icon}
          {label}
        </a>
      );
    }

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

// ── Helpers de cabecera ────────────────────────────────────────────────────

function countryFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65))
    .join("");
}

function LiveClock({ zonaHoraria }: { zonaHoraria: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const date = now.toLocaleDateString("es-419", {
    timeZone: zonaHoraria,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = now.toLocaleTimeString("es-419", {
    timeZone: zonaHoraria,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <span className="text-[10px] font-bold text-muted-foreground">
      {date} · {time}
    </span>
  );
}

// ── Recibo: idiomas ────────────────────────────────────────────────────────

type ReceiptLang = {
  title: string;
  loanSection: string;
  startDate: string;
  totalToPay: string;
  loanValue: string;
  interest: string;
  modality: string;
  installmentSection: string;
  installmentValue: string;
  installmentNumber: string;
  lastPayment: string;
  summarySection: string;
  totalPaid: string;
  balance: string;
  modalityMap: Record<string, string>;
};

const LANG_ES: ReceiptLang = {
  title: "Recibo de Pago",
  loanSection: "Información del Préstamo",
  startDate: "Inicio del préstamo",
  totalToPay: "Valor a pagar",
  loanValue: "Valor del préstamo",
  interest: "Interés",
  modality: "Modalidad",
  installmentSection: "Detalles de las Cuotas",
  installmentValue: "Valor de la cuota",
  installmentNumber: "Cuota actual",
  lastPayment: "Último pago",
  summarySection: "Resumen",
  totalPaid: "Total pagado",
  balance: "Saldo",
  modalityMap: { diaria: "Diaria", semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual" },
};

const LANG_PT: ReceiptLang = {
  title: "Recibo de Pagamento",
  loanSection: "Informações do Empréstimo",
  startDate: "Início do empréstimo",
  totalToPay: "Valor a pagar",
  loanValue: "Valor do empréstimo",
  interest: "Juros",
  modality: "Modalidade",
  installmentSection: "Detalhes das Parcelas",
  installmentValue: "Valor da parcela",
  installmentNumber: "Parcela atual",
  lastPayment: "Último pagamento",
  summarySection: "Resumo",
  totalPaid: "Total pago",
  balance: "Saldo",
  modalityMap: { diaria: "Diária", semanal: "Semanal", quincenal: "Quinzenal", mensual: "Mensal" },
};

function getReceiptLang(countryCode: string | null): ReceiptLang {
  return countryCode === "BR" ? LANG_PT : LANG_ES;
}

// ── Recibo: canvas ─────────────────────────────────────────────────────────

function drawReceiptCanvas(
  loan: ClientLoan,
  payments: PaymentHistory[],
  countryCode: string | null,
  zonaHoraria: string
): HTMLCanvasElement {
  const lang = getReceiptLang(countryCode);
  const W = 640;
  const PAD = 36;
  const ROW_H = 40;
  const SEC_H = 34;
  const SEP_H = 28;
  const FOOTER_H = 64;
  const HEADER_H = 130;
  const CLIENT_H = 94; // gap(28) + name(30) + date+dots(36)

  const sectionBlock = (rows: number) => SEC_H + rows * ROW_H + 16;
  const H =
    HEADER_H +
    CLIENT_H +
    sectionBlock(5) +
    SEP_H +
    sectionBlock(3) +
    SEP_H +
    sectionBlock(2) +
    20 +
    FOOTER_H;

  const SCALE = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  const GREEN = "#16a34a";
  const WHITE = "#ffffff";
  const DARK = "#09090b";
  const MUTED = "#71717a";
  const BORDER = "#e4e4e7";
  const GREEN_BG = "#f0fdf4";
  const FONT = (size: number, bold = false) =>
    `${bold ? 700 : 400} ${size}px -apple-system,"Helvetica Neue",Arial,sans-serif`;

  function txt(
    t: string,
    x: number,
    y: number,
    size: number,
    bold = false,
    color = DARK,
    align: CanvasTextAlign = "left"
  ) {
    ctx.fillStyle = color;
    ctx.font = FONT(size, bold);
    ctx.textAlign = align;
    ctx.fillText(t, x, y);
  }

  function hline(y: number, dashed = false) {
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.setLineDash(dashed ? [5, 5] : []);
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRow(label: string, value: string, y: number, highlight = false) {
    txt(label, PAD, y + 15, 12, false, MUTED);
    txt(value, W - PAD, y + 15, 13, true, highlight ? GREEN : DARK, "right");
    return y + ROW_H;
  }

  function drawSection(title: string, y: number) {
    ctx.fillStyle = GREEN_BG;
    ctx.fillRect(0, y, W, SEC_H);
    txt(title.toUpperCase(), PAD, y + 23, 11, true, GREEN);
    return y + SEC_H;
  }

  function drawSep(y: number) {
    hline(y + SEP_H / 2, true);
    return y + SEP_H;
  }

  // Background
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, HEADER_H);
  txt("● DinoPay ●", W / 2, 44, 11, true, "rgba(255,255,255,0.65)", "center");
  txt(lang.title, W / 2, 90, 26, true, WHITE, "center");

  let y = HEADER_H + 28;

  // Client name
  const clientName = (loan.clients?.alias ?? "Sin nombre").toUpperCase();
  txt(clientName, W / 2, y, 24, true, DARK, "center");
  y += 30;

  // Date / time
  const locale = countryCode === "BR" ? "pt-BR" : "es-419";
  const now = new Date();
  const dateStr = now.toLocaleDateString(locale, {
    timeZone: zonaHoraria,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString(locale, {
    timeZone: zonaHoraria,
    hour: "numeric",
    minute: "2-digit",
    hour12: countryCode !== "BR",
  });
  txt(`${dateStr}  ·  ${timeStr}`, W / 2, y, 13, false, MUTED, "center");
  y += 36;

  // ── Loan info ──
  y = drawSection(lang.loanSection, y);
  y = drawRow(lang.startDate, loan.fecha_inicio ?? "—", y);
  y = drawRow(lang.totalToPay, formatCurrency(Number(loan.total_a_cobrar)), y, true);
  y = drawRow(lang.loanValue, formatCurrency(Number(loan.valor_neto)), y);
  y = drawRow(lang.interest, `${loan.interes}%`, y);
  y = drawRow(lang.modality, lang.modalityMap[loan.modalidad] ?? loan.modalidad, y);
  y += 16;
  y = drawSep(y);

  // ── Installment details ──
  const lastPaymentMonto = payments[0]?.monto ?? null;
  y = drawSection(lang.installmentSection, y);
  y = drawRow(lang.installmentValue, formatCurrency(Number(loan.valor_cuota)), y, true);
  y = drawRow(lang.installmentNumber, `${loan.cuotas_pagadas} / ${loan.numero_cuotas}`, y);
  y = drawRow(
    lang.lastPayment,
    lastPaymentMonto ? formatCurrency(Number(lastPaymentMonto)) : "—",
    y
  );
  y += 16;
  y = drawSep(y);

  // ── Summary ──
  const totalPaid = Number(loan.total_a_cobrar) - Number(loan.saldo);
  y = drawSection(lang.summarySection, y);
  y = drawRow(lang.totalPaid, formatCurrency(totalPaid), y, true);
  y = drawRow(lang.balance, formatCurrency(Number(loan.saldo)), y);
  y += 20;

  // Footer
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, y, W, FOOTER_H);
  txt("Powered by DinoPay", W / 2, y + FOOTER_H / 2 + 5, 12, true, "rgba(255,255,255,0.75)", "center");

  return canvas;
}

// ── SheetReceipt ───────────────────────────────────────────────────────────

function SheetReceipt({
  loan,
  payments,
  countryCode,
  zonaHoraria,
}: {
  loan: ClientLoan;
  payments: PaymentHistory[];
  countryCode: string | null;
  zonaHoraria: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const canvas = drawReceiptCanvas(loan, payments, countryCode, zonaHoraria);
    canvasRef.current = canvas;
    setDataUrl(canvas.toDataURL("image/png"));
  }, [loan, payments, countryCode, zonaHoraria]);

  async function handleCopy() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCopying(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Recibo copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar, intenta descargar");
    } finally {
      setCopying(false);
    }
  }

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `recibo-${loan.clients?.alias ?? loan.id}.png`;
    a.click();
  }

  return (
    <div className="space-y-3 px-3">
      {dataUrl ? (
        <div className="overflow-hidden rounded-2xl border shadow-sm">
          <img alt="Recibo de pago" className="w-full" src={dataUrl} />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl bg-muted">
          <p className="text-sm text-muted-foreground">Generando recibo…</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-12 rounded-2xl font-black"
          disabled={!dataUrl}
          onClick={handleDownload}
          type="button"
          variant="secondary"
        >
          <Download className="h-4 w-4" />
          Descargar
        </Button>
        <Button
          className="h-12 rounded-2xl font-black shadow-lg shadow-primary/25"
          disabled={!dataUrl || copying}
          onClick={handleCopy}
          type="button"
        >
          <Copy className="h-4 w-4" />
          {copying ? "Copiando…" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
