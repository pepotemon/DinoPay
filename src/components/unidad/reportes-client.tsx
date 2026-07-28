"use client";

import { CalendarDays, Receipt, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

export type ReporteLoan = {
  id: string;
  clientAlias: string;
  modalidad: string;
  interes: number;
  numero_cuotas: number;
  valor_cuota: number;
  valor_neto: number;
  total_a_cobrar: number;
  hora: string;
  fecha: string;
};

export type ReportePayment = {
  id: string;
  clientAlias: string;
  cuotaInfo: string;
  metodo_pago: string;
  hora: string;
  monto: number;
  fecha_pago: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

export function ReportesClient({
  loans,
  payments
}: {
  loans: ReporteLoan[];
  payments: ReportePayment[];
}) {
  const today = todayStr();
  const [fecha, setFecha] = useState(today);
  const [tab, setTab] = useState<"prestamos" | "abonos">("prestamos");

  const dayLoans = useMemo(
    () => loans.filter((l) => l.fecha === fecha),
    [loans, fecha]
  );
  const dayPayments = useMemo(
    () => payments.filter((p) => p.fecha_pago === fecha),
    [payments, fecha]
  );

  const totalPrestado = useMemo(
    () => dayLoans.reduce((s, l) => s + Number(l.valor_neto), 0),
    [dayLoans]
  );
  const totalAbonado = useMemo(
    () => dayPayments.reduce((s, p) => s + Number(p.monto), 0),
    [dayPayments]
  );

  return (
    <>
      {/* Hero */}
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div>
          <h1 className="text-4xl font-black">Reportes</h1>
          <p className="capitalize text-lg font-bold text-primary">{formatDateNice(fecha)}</p>
        </div>
        <span className="select-none text-5xl">📊</span>
      </div>

      <div className="space-y-4">
        {/* Date picker */}
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
          <input
            className="h-12 w-full rounded-xl bg-green-50 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
            max={today}
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {/* Totalizadores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">Prestado</p>
            <p className="mt-1 text-xl font-black">{formatCurrency(totalPrestado)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dayLoans.length} préstamo{dayLoans.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">Abonado</p>
            <p className="mt-1 text-xl font-black text-primary">{formatCurrency(totalAbonado)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dayPayments.length} abono{dayPayments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-black transition-colors",
              tab === "prestamos"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            )}
            type="button"
            onClick={() => setTab("prestamos")}
          >
            Préstamos ({dayLoans.length})
          </button>
          <button
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-black transition-colors",
              tab === "abonos"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            )}
            type="button"
            onClick={() => setTab("abonos")}
          >
            Abonos ({dayPayments.length})
          </button>
        </div>

        {/* List */}
        {tab === "prestamos" ? (
          dayLoans.length === 0 ? (
            <EmptyState label="No se crearon préstamos este día" icon="loan" />
          ) : (
            <div className="space-y-3">
              {dayLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="space-y-2 rounded-2xl border bg-background p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black">{loan.clientAlias}</p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {loan.modalidad} · {loan.interes}% · {loan.hora}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-black">{formatCurrency(Number(loan.valor_neto))}</p>
                      <p className="text-xs text-muted-foreground">
                        → {formatCurrency(Number(loan.total_a_cobrar))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{loan.numero_cuotas} cuotas</span>
                    <span>Cuota: {formatCurrency(Number(loan.valor_cuota))}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : dayPayments.length === 0 ? (
          <EmptyState label="No se registraron abonos este día" icon="payment" />
        ) : (
          <div className="space-y-3">
            {dayPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between gap-3 rounded-2xl border bg-background p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-black">{payment.clientAlias}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {payment.cuotaInfo} · {payment.metodo_pago} · {payment.hora}
                  </p>
                </div>
                <p className="shrink-0 font-black text-primary">
                  {formatCurrency(Number(payment.monto))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({ label, icon }: { label: string; icon: "loan" | "payment" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
      {icon === "loan" ? (
        <TrendingUp className="h-12 w-12 opacity-20" />
      ) : (
        <Receipt className="h-12 w-12 opacity-20" />
      )}
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
