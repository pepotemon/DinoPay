"use client";

import {
  ChevronDown,
  CircleSlash,
  FileText,
  History,
  MapPinned,
  MessageCircle,
  MoreVertical,
  Phone,
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
  posicion: number | null;
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
  estado: string;
  fecha_inicio: string | null;
  created_at: string;
};

type Props = {
  loans: ClientLoan[];
  paidLoanIds: string[];
  noPayLoanIds: string[];
  paymentHistoryByLoan: Record<string, PaymentHistory[]>;
  loanHistoryByClient: Record<string, LoanHistory[]>;
  cobradoHoy: number;
  meta: number;
  totalSaldo: number;
};

type InfoModal =
  | { type: "details"; loan: ClientLoan }
  | { type: "payments"; loan: ClientLoan }
  | { type: "loans"; loan: ClientLoan }
  | null;

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function whatsappHref(phone: string, alias: string) {
  const msg = encodeURIComponent(`Hola ${alias}, te escribo de DinoPay sobre tu prestamo.`);
  return `https://wa.me/${digitsOnly(phone)}?text=${msg}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function PrestamosClient({
  loans,
  paidLoanIds,
  noPayLoanIds,
  paymentHistoryByLoan,
  loanHistoryByClient,
  cobradoHoy,
  meta,
  totalSaldo
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pendientes" | "visitados">("pendientes");
  const [selectedLoan, setSelectedLoan] = useState<ClientLoan | null>(null);
  const [noPayLoan, setNoPayLoan] = useState<ClientLoan | null>(null);
  const [menuLoan, setMenuLoan] = useState<ClientLoan | null>(null);
  const [infoModal, setInfoModal] = useState<InfoModal>(null);
  const [, startTransition] = useTransition();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const paidSet = useMemo(() => new Set(paidLoanIds), [paidLoanIds]);
  const noPaySet = useMemo(() => new Set(noPayLoanIds), [noPayLoanIds]);
  const visitedSet = useMemo(
    () => new Set([...paidLoanIds, ...noPayLoanIds]),
    [paidLoanIds, noPayLoanIds]
  );

  const faltante = Math.max(meta - cobradoHoy, 0);
  const progreso = meta > 0 ? Math.min(Math.round((cobradoHoy / meta) * 100), 100) : 0;
  const pendingCount = loans.filter((loan) => !visitedSet.has(loan.id)).length;

  const filtered = loans.filter((loan) => {
    const matchesFilter =
      (filter === "pendientes" && !visitedSet.has(loan.id)) ||
      (filter === "visitados" && visitedSet.has(loan.id));
    const q = search.toLowerCase();
    const searchable = [
      loan.clients?.alias,
      loan.clients?.barrio,
      loan.clients?.telefono1,
      loan.clients?.telefono2
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesFilter && (!q || searchable.includes(q));
  });

  function handlePayment(loanId: string, formData: FormData) {
    setSubmittingId(loanId);
    startTransition(async () => {
      const result = await registerPaymentAction({ ok: false, message: "" }, formData);
      setSubmittingId(null);
      if (result.ok) {
        setSelectedLoan(null);
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
        setNoPayLoan(null);
        toast.success("Cliente marcado sin pago");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-5 pb-6">
      <section className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">DinoPay</p>
        <h1 className="text-4xl font-black tracking-normal text-foreground">Cuotas Diarias</h1>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-primary to-teal-700 p-6 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-5 h-32 w-32 rounded-full bg-black/10" />
        <div className="relative grid grid-cols-[1fr_auto] gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              Recaudado hoy
            </p>
            <p className="mt-3 text-5xl font-black">{formatCurrency(cobradoHoy)}</p>
            <div className="mt-6 grid grid-cols-2 gap-5">
              <HeroStat label="Meta del dia" value={formatCurrency(meta)} />
              <HeroStat label="Faltan" value={formatCurrency(faltante)} />
            </div>
          </div>
          <div className="grid h-28 w-28 place-items-center self-center rounded-full border-[12px] border-white/20 bg-white/10">
            <div className="text-center">
              <p className="text-2xl font-black">{progreso}%</p>
              <p className="text-[10px] font-bold uppercase text-white/75">del dia</p>
            </div>
          </div>
          <div className="col-span-2 inline-flex w-fit items-center rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
            <span className="mr-2 h-2 w-2 rounded-full bg-white" />
            {visitedSet.size} / {loans.length} visitados
          </div>
          <p className="col-span-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70">
            Cartera total: {formatCurrency(totalSaldo)}
          </p>
        </div>
      </section>

      <Button asChild className="h-12 w-full rounded-2xl border shadow-sm" variant="secondary">
        <Link href="/unidad/enrutar">
          <MapPinned className="h-5 w-5" />
          Planear recorrido
        </Link>
      </Button>

      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-4 h-5 w-5 text-primary" />
        <input
          className="h-14 w-full rounded-2xl border-0 bg-muted pl-14 pr-4 text-base font-medium outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Busca por nombre, nit, telefono o alias"
          type="search"
          value={search}
        />
      </div>

      <div className="grid grid-cols-2 rounded-2xl bg-muted p-1">
        <button
          className={cn(
            "h-12 rounded-xl text-sm font-black transition-colors",
            filter === "pendientes" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          )}
          onClick={() => setFilter("pendientes")}
          type="button"
        >
          Pendientes ({pendingCount})
        </button>
        <button
          className={cn(
            "h-12 rounded-xl text-sm font-black transition-colors",
            filter === "visitados" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          )}
          onClick={() => setFilter("visitados")}
          type="button"
        >
          Visitados Hoy ({visitedSet.size})
        </button>
      </div>

      <section className="space-y-4">
        {filtered.map((loan) => {
          const clientName = loan.clients?.alias ?? "Cliente sin nombre";
          const isPaid = paidSet.has(loan.id);
          const isNoPay = noPaySet.has(loan.id) && !isPaid;
          const isVisited = visitedSet.has(loan.id);
          const isSubmitting = submittingId === loan.id;
          const paidAmount = Math.max(Number(loan.total_a_cobrar) - Number(loan.saldo), 0);

          return (
            <article
              className="rounded-3xl border bg-card p-5 shadow-sm shadow-muted-foreground/10"
              key={loan.id}
            >
              <div className="flex items-start gap-3">
                <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
                  {initials(clientName)}
                  {!isVisited ? (
                    <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-destructive" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black leading-tight">{clientName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isPaid ? (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        Pago registrado hoy
                      </span>
                    ) : isNoPay ? (
                      <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                        No pago hoy
                      </span>
                    ) : (
                      <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                        Pendiente por visitar
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
                  onClick={() => setMenuLoan(loan)}
                  type="button"
                >
                  <MoreVertical className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-muted p-4">
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Cuota de hoy
                    </p>
                    <p className="mt-2 text-4xl font-black">
                      {formatCurrency(Number(loan.valor_cuota))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Cuotas
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {loan.cuotas_pagadas} / {loan.numero_cuotas}
                    </p>
                    <span className="mt-1 inline-flex rounded-lg bg-background px-2 py-1 text-xs font-bold text-primary">
                      {loan.modalidad}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 px-4 py-4 text-center">
                <MiniStat label="Saldo" value={formatCurrency(Number(loan.saldo))} />
                <MiniStat label="Prestamo" value={formatCurrency(Number(loan.valor_neto))} />
                <MiniStat highlight label="Pagado" value={formatCurrency(paidAmount)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-12 rounded-2xl border border-destructive/20 bg-destructive/10 font-black text-destructive hover:bg-destructive/15"
                  disabled={isSubmitting || isVisited}
                  onClick={() => setNoPayLoan(loan)}
                  type="button"
                  variant="secondary"
                >
                  <CircleSlash className="h-5 w-5" />
                  No Pago
                </Button>
                <Button
                  className="h-12 rounded-2xl bg-primary font-black shadow-lg shadow-primary/25"
                  disabled={isSubmitting}
                  onClick={() => setSelectedLoan(loan)}
                  type="button"
                >
                  <WalletCards className="h-5 w-5" />
                  Pagar
                </Button>
              </div>
            </article>
          );
        })}

        {loans.length === 0 ? (
          <div className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground">
            Todavia no hay prestamos activos. Crea el primero desde Nuevo.
          </div>
        ) : null}

        {loans.length > 0 && filtered.length === 0 ? (
          <div className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground">
            No hay prestamos que coincidan con este filtro.
          </div>
        ) : null}
      </section>

      <PaymentModal
        isPending={selectedLoan ? submittingId === selectedLoan.id : false}
        loan={selectedLoan}
        onClose={() => setSelectedLoan(null)}
        onSubmit={handlePayment}
      />
      <NoPayModal
        isPending={noPayLoan ? submittingId === noPayLoan.id : false}
        loan={noPayLoan}
        onClose={() => setNoPayLoan(null)}
        onSubmit={handleNoPay}
      />
      <LoanActionsMenu
        loan={menuLoan}
        onClose={() => setMenuLoan(null)}
        onOpenInfo={(modal) => {
          setInfoModal(modal);
          setMenuLoan(null);
        }}
      />
      <LoanInfoModal
        modal={infoModal}
        loanHistoryByClient={loanHistoryByClient}
        onClose={() => setInfoModal(null)}
        paymentHistoryByLoan={paymentHistoryByLoan}
      />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function MiniStat({
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
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-base font-black", highlight && "text-primary")}>{value}</p>
    </div>
  );
}

function LoanActionsMenu({
  loan,
  onClose,
  onOpenInfo
}: {
  loan: ClientLoan | null;
  onClose: () => void;
  onOpenInfo: (modal: Exclude<InfoModal, null>) => void;
}) {
  if (!loan) {
    return null;
  }

  const clientName = loan.clients?.alias ?? "Cliente sin nombre";
  const phone = loan.clients?.telefono1 || loan.clients?.telefono2 || "";
  const hasPhone = digitsOnly(phone).length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Cerrar menu"
        className="absolute inset-0 bg-foreground/10"
        onClick={onClose}
        type="button"
      />
      <div className="absolute right-5 top-36 w-[min(22rem,calc(100vw-2.5rem))] rounded-[2rem] bg-background p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Acciones
            </p>
            <p className="font-black">{clientName}</p>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1">
          <ActionItem
            disabled={!hasPhone}
            href={hasPhone ? whatsappHref(phone, clientName) : "#"}
            icon={<MessageCircle className="h-6 w-6 text-primary" />}
            label="Whatsapp"
            newTab
            onClick={onClose}
          />
          <ActionItem
            disabled={!hasPhone}
            href={hasPhone ? `tel:${digitsOnly(phone)}` : "#"}
            icon={<Phone className="h-6 w-6" />}
            label="Llamar"
            onClick={onClose}
          />
          <ActionItem
            icon={<FileText className="h-6 w-6" />}
            label="Ver Detalles"
            onClick={() => onOpenInfo({ type: "details", loan })}
          />
          <ActionItem
            icon={<WalletCards className="h-6 w-6" />}
            label="Historial de Pagos"
            onClick={() => onOpenInfo({ type: "payments", loan })}
          />
          <ActionItem
            icon={<History className="h-6 w-6" />}
            label="Historial de Prestamos"
            onClick={() => onOpenInfo({ type: "loans", loan })}
          />
          <ActionItem
            href={`/unidad/prestamos/${loan.id}/editar-cliente`}
            icon={<UserPen className="h-6 w-6" />}
            label="Editar Cliente"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}

function ActionItem({
  disabled,
  href,
  icon,
  label,
  newTab,
  onClick
}: {
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
  newTab?: boolean;
  onClick: () => void;
}) {
  const className = cn(
    "flex h-14 w-full items-center gap-4 rounded-2xl px-3 text-left text-base font-black text-muted-foreground transition-colors hover:bg-muted",
    disabled && "pointer-events-none opacity-40"
  );

  if (href) {
    return (
      <Link
        className={className}
        href={href}
        onClick={onClick}
        rel={newTab ? "noreferrer" : undefined}
        target={newTab ? "_blank" : undefined}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function LoanInfoModal({
  loanHistoryByClient,
  modal,
  onClose,
  paymentHistoryByLoan
}: {
  loanHistoryByClient: Record<string, LoanHistory[]>;
  modal: InfoModal;
  onClose: () => void;
  paymentHistoryByLoan: Record<string, PaymentHistory[]>;
}) {
  if (!modal) {
    return null;
  }

  const { loan } = modal;
  const client = loan.clients;
  const title =
    modal.type === "details"
      ? "Detalles del cliente"
      : modal.type === "payments"
        ? "Historial de pagos"
        : "Historial de prestamos";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Cerrar informacion"
        className="absolute inset-0 bg-foreground/55"
        onClick={onClose}
        type="button"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-background p-5 shadow-2xl">
        <div className="mx-auto max-w-md space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-primary">{title}</p>
              <h2 className="mt-1 text-2xl font-black">
                {client?.alias ?? "Cliente sin nombre"}
              </h2>
            </div>
            <button
              className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {modal.type === "details" ? <LoanDetailsContent loan={loan} /> : null}
          {modal.type === "payments" ? (
            <PaymentHistoryContent payments={paymentHistoryByLoan[loan.id] ?? []} />
          ) : null}
          {modal.type === "loans" ? (
            <LoanHistoryContent activeLoanId={loan.id} loans={loanHistoryByClient[loan.client_id] ?? []} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoanDetailsContent({ loan }: { loan: ClientLoan }) {
  const client = loan.clients;
  const address = [client?.direccion1, client?.direccion2, client?.barrio]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted p-4">
        <InfoLine label="Saldo" value={formatCurrency(Number(loan.saldo))} />
        <InfoLine label="Cuota" value={formatCurrency(Number(loan.valor_cuota))} />
        <InfoLine label="Prestamo" value={formatCurrency(Number(loan.valor_neto))} />
        <InfoLine label="Total" value={formatCurrency(Number(loan.total_a_cobrar))} />
        <InfoLine label="Cuotas" value={`${loan.cuotas_pagadas}/${loan.numero_cuotas}`} />
        <InfoLine label="Modalidad" value={loan.modalidad} />
      </div>
      <div className="space-y-3 rounded-2xl border p-4">
        {client?.nit ? <InfoLine label="NIT" value={client.nit} /> : null}
        {client?.telefono1 ? <InfoLine label="Telefono 1" value={client.telefono1} /> : null}
        {client?.telefono2 ? <InfoLine label="Telefono 2" value={client.telefono2} /> : null}
        {address ? <InfoLine label="Direccion" value={address} /> : null}
        {!client?.nit && !client?.telefono1 && !client?.telefono2 && !address ? (
          <p className="text-sm text-muted-foreground">No hay datos adicionales registrados.</p>
        ) : null}
      </div>
    </div>
  );
}

function PaymentHistoryContent({ payments }: { payments: PaymentHistory[] }) {
  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
        Este prestamo todavia no tiene pagos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          className="flex items-center justify-between rounded-2xl border bg-muted/40 p-4"
          key={payment.id}
        >
          <div>
            <p className="font-black">{payment.fecha_pago}</p>
            <p className="text-sm text-muted-foreground">
              {payment.numero_cuotas} cuota(s) - {payment.metodo_pago}
            </p>
          </div>
          <p className="font-black text-primary">{formatCurrency(Number(payment.monto))}</p>
        </div>
      ))}
    </div>
  );
}

function LoanHistoryContent({
  activeLoanId,
  loans
}: {
  activeLoanId: string;
  loans: LoanHistory[];
}) {
  if (loans.length === 0) {
    return (
      <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
        Este cliente todavia no tiene historial de prestamos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loans.map((loan) => (
        <div className="rounded-2xl border bg-muted/40 p-4" key={loan.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black">
                {loan.id === activeLoanId ? "Prestamo activo" : "Prestamo anterior"}
              </p>
              <p className="text-sm text-muted-foreground">
                {loan.fecha_inicio ?? loan.created_at.slice(0, 10)}
              </p>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-black text-primary">
              {loan.estado}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Prestamo" value={formatCurrency(Number(loan.valor_neto))} />
            <MiniStat label="Total" value={formatCurrency(Number(loan.total_a_cobrar))} />
            <MiniStat label="Saldo" value={formatCurrency(Number(loan.saldo))} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function PaymentModal({
  isPending,
  loan,
  onClose,
  onSubmit
}: {
  isPending: boolean;
  loan: ClientLoan | null;
  onClose: () => void;
  onSubmit: (loanId: string, formData: FormData) => void;
}) {
  const [confirmation, setConfirmation] = useState<{
    formData: FormData;
    monto: string;
    cuotas: string;
    metodo: string;
  } | null>(null);

  if (!loan) {
    return null;
  }

  const clientName = loan.clients?.alias ?? "Cliente sin nombre";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Cerrar pago"
        className="absolute inset-0 bg-foreground/55"
        onClick={onClose}
        type="button"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background p-5 shadow-2xl">
        <div className="mx-auto max-w-md space-y-6">
          <div className="relative px-10 text-center">
            <h2 className="text-3xl font-black leading-tight">
              Registrar Pago a
              <span className="block text-primary">{clientName}</span>
            </h2>
            <button
              className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-xl text-muted-foreground"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted p-4 text-center">
            <MiniStat label="Saldo" value={formatCurrency(Number(loan.saldo))} />
            <MiniStat label="Cuotas" value={`${loan.cuotas_pagadas}/${loan.numero_cuotas}`} />
            <MiniStat highlight label="Cuota" value={formatCurrency(Number(loan.valor_cuota))} />
          </div>

          {confirmation ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-primary/10 p-4 text-center">
                <p className="text-sm font-bold text-muted-foreground">Confirmar pago</p>
                <p className="mt-2 text-3xl font-black text-primary">
                  {formatCurrency(Number(confirmation.monto))}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {confirmation.cuotas} cuota(s) - {confirmation.metodo}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-14 rounded-2xl font-black"
                  disabled={isPending}
                  onClick={() => setConfirmation(null)}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  className="h-14 rounded-2xl font-black shadow-lg shadow-primary/20"
                  disabled={isPending}
                  onClick={() => onSubmit(loan.id, confirmation.formData)}
                  type="button"
                >
                  {isPending ? "Guardando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                setConfirmation({
                  formData,
                  monto: String(formData.get("monto") ?? "0"),
                  cuotas: String(formData.get("numeroCuotas") ?? "1"),
                  metodo: String(formData.get("metodoPago") ?? "")
                });
              }}
            >
              <input name="loanId" type="hidden" value={loan.id} />
              <PaymentInputs
                isPending={isPending}
                maxCuotas={Math.max(loan.numero_cuotas - loan.cuotas_pagadas, 1)}
                valorCuota={Number(loan.valor_cuota)}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const noPayReasons = [
  "No estaba en casa",
  "No contesta",
  "Dice que paga manana",
  "Sin dinero",
  "Direccion incorrecta",
  "Otro"
];

function NoPayModal({
  isPending,
  loan,
  onClose,
  onSubmit
}: {
  isPending: boolean;
  loan: ClientLoan | null;
  onClose: () => void;
  onSubmit: (loanId: string, nota: string) => void;
}) {
  const [reason, setReason] = useState(noPayReasons[0]);
  const [confirming, setConfirming] = useState(false);

  if (!loan) {
    return null;
  }

  const clientName = loan.clients?.alias ?? "Cliente sin nombre";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Cerrar no pago"
        className="absolute inset-0 bg-foreground/55"
        onClick={onClose}
        type="button"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background p-5 shadow-2xl">
        <div className="mx-auto max-w-md space-y-6">
          <div className="relative px-10 text-center">
            <h2 className="text-3xl font-black leading-tight">
              Marcar como no pagado a
              <span className="block text-primary">{clientName} ?</span>
            </h2>
            <button
              className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-xl text-muted-foreground"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {confirming ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-destructive/10 p-4 text-center">
                <p className="text-sm font-bold text-muted-foreground">Confirmar no pago</p>
                <p className="mt-2 text-xl font-black text-destructive">{reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-14 rounded-2xl font-black"
                  disabled={isPending}
                  onClick={() => setConfirming(false)}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  className="h-14 rounded-2xl font-black shadow-lg shadow-primary/20"
                  disabled={isPending}
                  onClick={() => onSubmit(loan.id, reason)}
                  type="button"
                >
                  {isPending ? "Guardando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <label className="block space-y-3">
                <span className="text-base font-medium">
                  Razon <span className="text-destructive">*</span>
                </span>
                <div className="relative">
                  <select
                    className="h-14 w-full appearance-none rounded-xl bg-primary/10 px-4 pr-11 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    name="nota"
                    onChange={(event) => setReason(event.target.value)}
                    value={reason}
                  >
                    {noPayReasons.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-4 h-6 w-6 text-muted-foreground" />
                </div>
              </label>

              <Button
                className="h-14 w-full rounded-2xl text-base font-black shadow-lg shadow-primary/20"
                disabled={isPending}
                onClick={() => setConfirming(true)}
                type="button"
              >
                Continuar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
