"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { addDaysToDateString } from "@/lib/utils/date-timezone";

export type CajaData = {
  today: string;
  capitalInicial: number;
  payments: { loan_id: string; monto: number; fecha_pago: string }[];
  loansCreated: { valor_neto: number; fecha: string }[];
  expensesApproved: { monto: number; fecha: string }[];
  capitalMovs: { tipo: string; monto: number; fecha: string }[];
  activeLoansCount: number;
  visits: { loan_id: string; fecha: string }[];
};

function addDays(dateStr: string, n: number): string {
  return addDaysToDateString(dateStr, n);
}

function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function CajaDelDiaClient({ data }: { data: CajaData }) {
  const today = data.today;
  const [fecha, setFecha] = useState(today);

  const isToday = fecha === today;

  // ── Caja Inicial (everything strictly BEFORE fecha) ──
  const cajaInicial = useMemo(() => {
    const cobrado = data.payments
      .filter((p) => p.fecha_pago < fecha)
      .reduce((s, p) => s + Number(p.monto), 0);
    const prestado = data.loansCreated
      .filter((l) => l.fecha < fecha)
      .reduce((s, l) => s + Number(l.valor_neto), 0);
    const gastos = data.expensesApproved
      .filter((e) => e.fecha < fecha)
      .reduce((s, e) => s + Number(e.monto), 0);
    const ingresos = data.capitalMovs
      .filter((m) => m.fecha < fecha && m.tipo === "ingreso")
      .reduce((s, m) => s + Number(m.monto), 0);
    const retiros = data.capitalMovs
      .filter((m) => m.fecha < fecha && m.tipo === "retiro")
      .reduce((s, m) => s + Number(m.monto), 0);
    return data.capitalInicial + cobrado - prestado - gastos + ingresos - retiros;
  }, [data, fecha]);

  // ── Daily stats ──
  const dayLoansCreated = useMemo(
    () => data.loansCreated.filter((l) => l.fecha === fecha),
    [data.loansCreated, fecha]
  );
  const cobradoHoy = useMemo(
    () =>
      data.payments
        .filter((p) => p.fecha_pago === fecha)
        .reduce((s, p) => s + Number(p.monto), 0),
    [data.payments, fecha]
  );
  const prestadoHoy = useMemo(
    () => dayLoansCreated.reduce((s, l) => s + Number(l.valor_neto), 0),
    [dayLoansCreated]
  );
  const gastosHoy = useMemo(
    () =>
      data.expensesApproved
        .filter((e) => e.fecha === fecha)
        .reduce((s, e) => s + Number(e.monto), 0),
    [data.expensesApproved, fecha]
  );
  const ingresosHoy = useMemo(
    () =>
      data.capitalMovs
        .filter((m) => m.fecha === fecha && m.tipo === "ingreso")
        .reduce((s, m) => s + Number(m.monto), 0),
    [data.capitalMovs, fecha]
  );
  const retirosHoy = useMemo(
    () =>
      data.capitalMovs
        .filter((m) => m.fecha === fecha && m.tipo === "retiro")
        .reduce((s, m) => s + Number(m.monto), 0),
    [data.capitalMovs, fecha]
  );

  const cajaFinal = cajaInicial + cobradoHoy - prestadoHoy + ingresosHoy - retirosHoy - gastosHoy;

  // ── Clientes ──
  const paidIds = useMemo(
    () => new Set(data.payments.filter((p) => p.fecha_pago === fecha).map((p) => p.loan_id)),
    [data.payments, fecha]
  );
  const noPayIds = useMemo(
    () => new Set(data.visits.filter((v) => v.fecha === fecha).map((v) => v.loan_id)),
    [data.visits, fecha]
  );
  const visitadosCount = useMemo(
    () => new Set([...paidIds, ...noPayIds]).size,
    [paidIds, noPayIds]
  );
  const programadosCount = data.activeLoansCount;
  const pendientesCount = Math.max(0, programadosCount - visitadosCount);

  return (
    <div className="pb-6">
      {/* ── Date nav ── */}
      <div className="flex items-center justify-between px-1 pb-5 pt-3">
        <button
          className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors active:bg-muted/70"
          type="button"
          onClick={() => setFecha(addDays(fecha, -1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <p className="text-xl font-black text-primary">{formatDisplay(fecha)}</p>

        <button
          className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors active:bg-muted/70 disabled:opacity-30"
          disabled={isToday}
          type="button"
          onClick={() => setFecha(addDays(fecha, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── 8 stat cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Caja Inicial" value={formatCurrency(cajaInicial)} />
        <StatCard label="Caja Final" value={formatCurrency(cajaFinal)} />
        <StatCard label="Cobrado" value={formatCurrency(cobradoHoy)} />
        <StatCard
          label={`Préstamos (${dayLoansCreated.length})`}
          value={formatCurrency(prestadoHoy)}
        />
        <StatCard label="Ingresos" value={formatCurrency(ingresosHoy)} />
        <StatCard label="Gastos" value={formatCurrency(gastosHoy)} />
        <StatCard label="Retiros" value={formatCurrency(retirosHoy)} />
        <StatCard label="Cuadres de caja" value={formatCurrency(0)} />
      </div>

      {/* ── Clientes ── */}
      <p className="mt-6 text-center text-xl font-black text-primary">Clientes</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard label="Programados" value={String(programadosCount)} large />
        <StatCard label="Visitados" value={String(visitadosCount)} large />
      </div>

      <div className="mt-3 rounded-2xl bg-foreground p-5 text-center shadow-sm">
        <p className="text-3xl font-black text-background">{pendientesCount}</p>
        <p className="mt-1 text-sm font-bold text-background/60">Pendientes</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  large
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <p className={`font-black ${large ? "text-3xl" : "text-2xl"}`}>{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
