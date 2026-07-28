"use client";

import { Banknote, CalendarDays, ChevronDown } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type State = { ok: boolean; message: string };
type Action = (prev: State, formData: FormData) => Promise<State>;

const INPUT =
  "h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20";
const SELECT =
  "h-12 w-full appearance-none rounded-xl bg-green-50 px-4 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20";

type Defaults = {
  modalidad: string;
  interes: number;
  valorNeto: number;
  numeroCuotas: number;
};

export function ExistingClientLoanForm({
  action,
  clientId,
  clientAlias,
  clientNit,
  clientDireccion1,
  defaults,
  interests
}: {
  action: Action;
  clientId: string;
  clientAlias: string;
  clientNit: string | null;
  clientDireccion1: string | null;
  defaults: Defaults;
  interests: number[];
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });

  const [valorNeto, setValorNeto] = useState(defaults.valorNeto);
  const [numeroCuotas, setNumeroCuotas] = useState(defaults.numeroCuotas);
  const [interes, setInteres] = useState(defaults.interes);
  const [modalidad, setModalidad] = useState(defaults.modalidad);

  const preview = useMemo(() => {
    const total = valorNeto * (1 + interes / 100);
    const cuota = numeroCuotas > 0 ? total / numeroCuotas : 0;
    return { total, cuota };
  }, [interes, numeroCuotas, valorNeto]);

  const modalidadLabel: Record<string, string> = {
    diaria: "Diaria",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual"
  };

  return (
    <form action={formAction} className="space-y-4">
      <input name="clientId" type="hidden" value={clientId} />

      {/* ── PRÉSTAMO ── */}
      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <SectionHead icon={<Banknote className="h-4 w-4" />} label="Préstamo" />

        <label className="block space-y-1.5">
          <span className="text-sm font-bold">
            Modalidad <span className="text-destructive">*</span>
          </span>
          <div className="relative">
            <select
              className={SELECT}
              name="modalidad"
              required
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
            >
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold">
            Interés (%) <span className="text-destructive">*</span>
          </span>
          <div className="relative">
            <select
              className={SELECT}
              name="interes"
              required
              value={interes}
              onChange={(e) => setInteres(Number(e.target.value))}
            >
              {interests.map((i) => (
                <option key={i} value={i}>
                  {i}%
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </label>

        <FieldRow
          label="Valor Neto"
          required
          icon={<Banknote className="h-4 w-4 text-primary/50" />}
        >
          <input
            className={INPUT}
            min="1"
            name="valorNeto"
            placeholder="0"
            required
            type="number"
            value={valorNeto || ""}
            onChange={(e) => setValorNeto(Number(e.target.value))}
          />
        </FieldRow>

        <FieldRow
          label="Número de cuotas"
          required
          icon={<CalendarDays className="h-4 w-4 text-primary/50" />}
        >
          <input
            className={INPUT}
            min="1"
            name="numeroCuotas"
            placeholder="0"
            required
            type="number"
            value={numeroCuotas || ""}
            onChange={(e) => setNumeroCuotas(Number(e.target.value))}
          />
        </FieldRow>

        {/* ── Credit card preview ── */}
        <CreditCardPreview
          alias={clientAlias}
          nit={clientNit}
          direccion1={clientDireccion1}
          cuota={preview.cuota}
          total={preview.total}
          modalidad={modalidadLabel[modalidad] ?? modalidad}
        />
      </section>

      {/* Error */}
      {state.message ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {state.message}
        </p>
      ) : null}

      {/* Submit */}
      <button
        className="h-14 w-full rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-50"
        disabled={pending || interests.length === 0}
        type="submit"
      >
        {pending ? "Guardando…" : "Crear préstamo"}
      </button>
    </form>
  );
}

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-1 flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function FieldRow({
  children,
  icon,
  label,
  required: req
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-bold">
        {label}
        {req && <span className="text-destructive"> *</span>}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-3.5">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function CreditCardPreview({
  alias,
  nit,
  direccion1,
  cuota,
  total,
  modalidad
}: {
  alias: string;
  nit: string | null;
  direccion1: string | null;
  cuota: number;
  total: number;
  modalidad: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-primary to-green-900 p-5 text-white shadow-xl shadow-primary/30"
      style={{ aspectRatio: "86/54" }}
    >
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 right-8 h-36 w-36 rounded-full bg-white/5" />
      <div className="absolute -left-6 bottom-4 h-24 w-24 rounded-full bg-black/10" />

      <div className="relative flex items-start justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
          DinoPay
        </span>
        <div className="grid h-6 w-8 grid-cols-3 grid-rows-3 gap-[2px] rounded-[3px] bg-yellow-300/90 p-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-[1px] bg-yellow-500/60" />
          ))}
        </div>
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/75">
            Valor por cuota
          </p>
          <p className="mt-0.5 text-2xl font-black leading-none">{formatCurrency(cuota)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/75">plazo</p>
          <p className="text-sm font-black">{modalidad}</p>
        </div>
      </div>

      <p className="relative mt-2 truncate text-[9px] font-semibold text-white/70">
        {direccion1 || "Dirección —"}
      </p>

      <div className="relative mt-auto flex items-end justify-between gap-2 pt-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-widest">
            {alias || "NOMBRE DEL CLIENTE"}
          </p>
          <p className="text-[9px] font-semibold text-white/75">{nit || "••••••••"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/75">total</p>
          <p className="text-sm font-black">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
