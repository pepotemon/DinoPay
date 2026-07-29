"use client";

import {
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  MinusCircle,
  Package,
  PlusCircle,
  Receipt,
  SlidersHorizontal,
  Wallet,
  X
} from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAjusteAction, type AjusteState } from "@/lib/actions/unidad/ajustes";
import { cn, formatCurrency } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/utils/date-timezone";
import { PageDino } from "@/components/unidad/page-dino";

export type FlujoPayment = { monto: number; metodo_pago: string; fecha_pago: string };
export type FlujoLoan = { valor_neto: number; fecha: string };
export type FlujoExpense = { monto: number; fecha: string };
export type FlujoAjuste = {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string | null;
  fecha: string;
};

export type FlujoData = {
  payments: FlujoPayment[];
  loans: FlujoLoan[];
  expenses: FlujoExpense[];
  ajustes: FlujoAjuste[];
};

function getWeekStart(today: string): string {
  const [year, month, dayOfMonth] = today.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, dayOfMonth, 12));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysToDateString(today, diff);
}

function daysBetween(start: string, end: string): string[] {
  const days: string[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDaysToDateString(cur, 1);
  }
  return days;
}

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDayHeader(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const INITIAL_STATE: AjusteState = { ok: false, message: "" };

const INPUT =
  "h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20";

export function FlujoSemanalClient({ data, today }: { data: FlujoData; today: string }) {
  const [fechaInicio, setFechaInicio] = useState(getWeekStart(today));
  const [fechaFin, setFechaFin] = useState(today);
  const [showSheet, setShowSheet] = useState(false);
  const [copied, setCopied] = useState<"resumen" | "todo" | null>(null);

  const [ajusteState, ajusteAction] = useActionState(createAjusteAction, INITIAL_STATE);

  // Close sheet on successful ajuste creation (redirect handles data refresh)
  useEffect(() => {
    if (ajusteState.ok) setShowSheet(false);
  }, [ajusteState.ok]);

  // ── Filtered data ──
  const payments = useMemo(
    () => data.payments.filter((p) => p.fecha_pago >= fechaInicio && p.fecha_pago <= fechaFin),
    [data.payments, fechaInicio, fechaFin]
  );
  const loans = useMemo(
    () => data.loans.filter((l) => l.fecha >= fechaInicio && l.fecha <= fechaFin),
    [data.loans, fechaInicio, fechaFin]
  );
  const expenses = useMemo(
    () => data.expenses.filter((e) => e.fecha >= fechaInicio && e.fecha <= fechaFin),
    [data.expenses, fechaInicio, fechaFin]
  );
  const ajustes = useMemo(
    () => data.ajustes.filter((a) => a.fecha >= fechaInicio && a.fecha <= fechaFin),
    [data.ajustes, fechaInicio, fechaFin]
  );

  // ── Weekly totals ──
  const cobradoTransferencia = useMemo(
    () =>
      payments
        .filter((p) => p.metodo_pago === "transferencia")
        .reduce((s, p) => s + Number(p.monto), 0),
    [payments]
  );
  const cobradoEfectivo = useMemo(
    () =>
      payments
        .filter((p) => p.metodo_pago !== "transferencia")
        .reduce((s, p) => s + Number(p.monto), 0),
    [payments]
  );
  const cobradoTotal = cobradoTransferencia + cobradoEfectivo;
  const prestadoTotal = useMemo(
    () => loans.reduce((s, l) => s + Number(l.valor_neto), 0),
    [loans]
  );
  const gastosTotal = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.monto), 0),
    [expenses]
  );
  const ajusteNeto = useMemo(
    () =>
      ajustes.reduce(
        (s, a) => s + (a.tipo === "ingreso" ? Number(a.monto) : -Number(a.monto)),
        0
      ),
    [ajustes]
  );
  const recaudadoTotal = cobradoTotal - prestadoTotal - gastosTotal + ajusteNeto;

  // ── Daily data ──
  const rangeDays = useMemo(
    () => daysBetween(fechaInicio, fechaFin),
    [fechaInicio, fechaFin]
  );

  const dayRows = useMemo(
    () =>
      rangeDays.map((day) => {
        const dp = payments.filter((p) => p.fecha_pago === day);
        const dl = loans.filter((l) => l.fecha === day);
        const de = expenses.filter((e) => e.fecha === day);
        const da = ajustes.filter((a) => a.fecha === day);
        const cobrado = dp.reduce((s, p) => s + Number(p.monto), 0);
        const transferencia = dp
          .filter((p) => p.metodo_pago === "transferencia")
          .reduce((s, p) => s + Number(p.monto), 0);
        const efectivo = dp
          .filter((p) => p.metodo_pago !== "transferencia")
          .reduce((s, p) => s + Number(p.monto), 0);
        const prestado = dl.reduce((s, l) => s + Number(l.valor_neto), 0);
        const gastos = de.reduce((s, e) => s + Number(e.monto), 0);
        const ajusteNetoDia = da.reduce(
          (s, a) => s + (a.tipo === "ingreso" ? Number(a.monto) : -Number(a.monto)),
          0
        );
        const recaudado = cobrado - prestado - gastos;
        const totalFinal = recaudado + ajusteNetoDia;
        return { day, cobrado, transferencia, efectivo, prestado, gastos, ajusteNetoDia, recaudado, totalFinal };
      }),
    [rangeDays, payments, loans, expenses, ajustes]
  );

  // ── Clipboard ──
  function buildResumenText() {
    return [
      `📊 Flujo Semanal`,
      `${formatDateDisplay(fechaInicio)} - ${formatDateDisplay(fechaFin)}`,
      ``,
      `Cobrado: ${formatCurrency(cobradoTotal)}`,
      `  Transferencia: ${formatCurrency(cobradoTransferencia)}`,
      `  Efectivo: ${formatCurrency(cobradoEfectivo)}`,
      `Prestado: -${formatCurrency(prestadoTotal)}`,
      `Gastos: -${formatCurrency(gastosTotal)}`,
      `Ajustes: ${formatCurrency(ajusteNeto)}`,
      `Recaudado: ${formatCurrency(recaudadoTotal)}`
    ].join("\n");
  }

  function buildDayText(row: (typeof dayRows)[0]) {
    return [
      `📅 ${capitalize(formatDayHeader(row.day))}`,
      `Prestado: -${formatCurrency(row.prestado)}`,
      `Cobrado: ${formatCurrency(row.cobrado)}`,
      `  Transferencia: ${formatCurrency(row.transferencia)}`,
      `  Efectivo: ${formatCurrency(row.efectivo)}`,
      `Gastos: -${formatCurrency(row.gastos)}`,
      `Ajustes: ${formatCurrency(row.ajusteNetoDia)}`,
      `Total Recaudado: ${formatCurrency(row.recaudado)}`,
      `Total Final: ${formatCurrency(row.totalFinal)}`
    ].join("\n");
  }

  async function copy(text: string, key: "resumen" | "todo") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  return (
    <>
      {/* Hero */}
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div>
          <h1 className="text-4xl font-black">Flujo</h1>
          <p className="text-4xl font-black text-primary">Semanal</p>
        </div>
        <PageDino label="Flujo semanal" variant="flow" />
      </div>

      <div className="space-y-4">
        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs font-bold text-muted-foreground">Fecha Inicial</p>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                className="h-12 w-full rounded-xl bg-green-50 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                max={fechaFin}
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold text-muted-foreground">Fecha Final</p>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
              <input
                className="h-12 w-full rounded-xl bg-green-50 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                min={fechaInicio}
                max={today}
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Crear Ajuste */}
        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity active:opacity-80"
          type="button"
          onClick={() => setShowSheet(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Crear Ajuste
        </button>

        {/* Copiar Resumen */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors active:text-primary"
            type="button"
            onClick={() => copy(buildResumenText(), "resumen")}
          >
            {copied === "resumen" ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === "resumen" ? "Copiado" : "Copiar Resumen"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cobrado */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <p className="text-2xl font-black">{formatCurrency(cobradoTotal)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Cobrado</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Transferencia: {formatCurrency(cobradoTransferencia)}
            </p>
            <p className="text-xs text-muted-foreground">
              Efectivo: {formatCurrency(cobradoEfectivo)}
            </p>
          </div>

          {/* Prestado */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <p className="text-2xl font-black">{formatCurrency(prestadoTotal)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Prestado</p>
          </div>

          {/* Gastos */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <p className="text-2xl font-black">{formatCurrency(gastosTotal)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Gastos</p>
          </div>

          {/* Recaudado */}
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <p className={cn("text-2xl font-black", recaudadoTotal < 0 && "text-destructive")}>
              {formatCurrency(recaudadoTotal)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Recaudado</p>
          </div>
        </div>

        {/* Ajustes — full width */}
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-2xl font-black">{formatCurrency(ajusteNeto)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajustes</p>
        </div>

        {/* Copiar Todo */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors active:text-primary"
            type="button"
            onClick={() =>
              copy(
                [buildResumenText(), "", ...dayRows.map(buildDayText)].join("\n"),
                "todo"
              )
            }
          >
            {copied === "todo" ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === "todo" ? "Copiado" : "Copiar Todo"}
          </button>
        </div>

        {/* Daily breakdown cards */}
        <div className="space-y-3">
          {dayRows.map((row) => (
            <DayCard key={row.day} row={row} onCopy={() => copy(buildDayText(row), "todo")} />
          ))}
        </div>
      </div>

      {/* ── Crear Ajuste sheet ── */}
      {showSheet ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowSheet(false)}
            type="button"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-background shadow-2xl">
            <div className="mx-auto max-w-md">
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="flex items-center gap-2 px-5 py-3">
                <p className="flex-1 text-xl font-black">Crear Ajuste</p>
                <button
                  className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground"
                  onClick={() => setShowSheet(false)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form action={ajusteAction} className="space-y-4 px-5 pb-8">
                <input name="semanaInicio" type="hidden" value={fechaInicio} />

                <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
                  {/* Tipo */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">
                      Tipo <span className="text-destructive">*</span>
                    </span>
                    <div className="relative">
                      <select
                        className="h-12 w-full appearance-none rounded-xl bg-green-50 px-4 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue="ingreso"
                        name="tipo"
                        required
                      >
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted-foreground" />
                    </div>
                  </label>

                  {/* Monto */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">
                      Monto <span className="text-destructive">*</span>
                    </span>
                    <div className="relative">
                      <Banknote className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-primary/50" />
                      <input
                        className={INPUT}
                        inputMode="decimal"
                        min="0.01"
                        name="monto"
                        placeholder="0"
                        required
                        step="0.01"
                        type="number"
                      />
                    </div>
                  </label>

                  {/* Fecha */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">
                      Fecha <span className="text-destructive">*</span>
                    </span>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                      <input
                        className="h-12 w-full rounded-xl bg-green-50 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={today}
                        max={today}
                        name="fecha"
                        required
                        type="date"
                      />
                    </div>
                  </label>

                  {/* Descripcion */}
                  <label className="block space-y-1.5">
                    <span className="text-sm font-bold">Descripción</span>
                    <textarea
                      className="min-h-[72px] w-full resize-none rounded-xl bg-green-50 px-4 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                      name="descripcion"
                      placeholder="Opcional…"
                    />
                  </label>

                  {ajusteState.message && !ajusteState.ok ? (
                    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">
                      {ajusteState.message}
                    </p>
                  ) : null}
                </section>

                <SheetSubmitButton />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SheetSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="h-14 w-full rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando…" : "Guardar ajuste"}
    </button>
  );
}

type DayRow = {
  day: string;
  cobrado: number;
  transferencia: number;
  efectivo: number;
  prestado: number;
  gastos: number;
  ajusteNetoDia: number;
  recaudado: number;
  totalFinal: number;
};

function DayCard({ row, onCopy }: { row: DayRow; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      {/* Day header */}
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 font-black text-primary capitalize">
          {capitalize(formatDayHeader(row.day))}
        </p>
        <button
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors active:bg-muted/70"
          type="button"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <LineItem icon={<Banknote className="h-4 w-4" />} label="Prestado" value={`-${formatCurrency(row.prestado)}`} negative />
        <LineItem icon={<CreditCard className="h-4 w-4" />} label="Cobrado" value={formatCurrency(row.cobrado)} />
        <LineItem icon={<Receipt className="h-4 w-4" />} label="Transferencia" value={formatCurrency(row.transferencia)} indent />
        <LineItem icon={<Receipt className="h-4 w-4" />} label="Efectivo" value={formatCurrency(row.efectivo)} indent />
        <LineItem icon={<MinusCircle className="h-4 w-4" />} label="Gastos" value={`-${formatCurrency(row.gastos)}`} negative />
        <LineItem icon={<SlidersHorizontal className="h-4 w-4" />} label="Ajustes" value={formatCurrency(row.ajusteNetoDia)} />
        <div className="my-1 border-t" />
        <LineItem icon={<Package className="h-4 w-4" />} label="Total Recaudado" value={formatCurrency(row.recaudado)} bold />
        <LineItem icon={<Wallet className="h-4 w-4" />} label="Total Final" value={formatCurrency(row.totalFinal)} bold />
      </div>
    </div>
  );
}

function LineItem({
  icon,
  label,
  value,
  negative,
  bold,
  indent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", indent && "pl-5")}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className={cn("text-sm", bold && "font-black text-foreground")}>{label}</span>
      </div>
      <span
        className={cn(
          "text-sm font-bold",
          negative && "text-destructive",
          bold && "font-black"
        )}
      >
        {value}
      </span>
    </div>
  );
}
