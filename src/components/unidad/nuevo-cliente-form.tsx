"use client";

import {
  Banknote,
  Building2,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Hash,
  Home,
  MapPin,
  Phone,
  User,
  Users
} from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type State = { ok: boolean; message: string };
type Action = (prev: State, formData: FormData) => Promise<State>;

const INPUT =
  "h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20";
const SELECT =
  "h-12 w-full appearance-none rounded-xl bg-green-50 px-4 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20";

export function NuevoClienteForm({
  createClientLoan,
  interests
}: {
  createClientLoan: Action;
  interests: number[];
}) {
  const [state, formAction, pending] = useActionState(createClientLoan, {
    ok: false,
    message: ""
  });

  const [alias, setAlias] = useState("");
  const [nit, setNit] = useState("");
  const [direccion1, setDireccion1] = useState("");
  const [valorNeto, setValorNeto] = useState(0);
  const [numeroCuotas, setNumeroCuotas] = useState(0);
  const [interes, setInteres] = useState(interests[0] ?? 10);
  const [modalidad, setModalidad] = useState("diaria");
  const [enrutar, setEnrutar] = useState(false);

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
    <form action={formAction} className="max-w-lg mx-auto space-y-4">
      {/* ── IDENTIFICACIÓN ── */}
      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <SectionHead icon={<User className="h-4 w-4" />} label="Identificación" />

        <FieldRow label="Nombre" required icon={<User className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="alias"
            placeholder="Nombre y Apellido"
            required
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="NIT / Cédula" icon={<CreditCard className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="nit"
            placeholder="Documento"
            value={nit}
            onChange={(e) => setNit(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Teléfono 1" icon={<Phone className="h-4 w-4 text-primary/50" />}>
          <input className={INPUT} name="telefono1" placeholder="Número" type="tel" />
        </FieldRow>

        <FieldRow label="Teléfono 2" icon={<Phone className="h-4 w-4 text-primary/50" />}>
          <input className={INPUT} name="telefono2" placeholder="Alternativo" type="tel" />
        </FieldRow>

        <label className="block space-y-1.5">
          <span className="text-sm font-bold">Género</span>
          <div className="relative">
            <select className={SELECT} name="genero">
              <option value="">Sin especificar</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
          </div>
        </label>
      </section>

      {/* ── DOMICILIO ── */}
      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <SectionHead icon={<MapPin className="h-4 w-4" />} label="Domicilio" />

        <FieldRow label="Dirección 1" icon={<Home className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="direccion1"
            placeholder="Calle, Carrera, Av…"
            value={direccion1}
            onChange={(e) => setDireccion1(e.target.value)}
          />
        </FieldRow>

        <FieldRow label="Dirección 2" icon={<Building2 className="h-4 w-4 text-primary/50" />}>
          <input className={INPUT} name="direccion2" placeholder="Apto, Local, Casa…" />
        </FieldRow>

        <FieldRow label="Barrio" icon={<MapPin className="h-4 w-4 text-primary/50" />}>
          <input className={INPUT} name="barrio" placeholder="Barrio o zona" />
        </FieldRow>
      </section>

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

        {/* Toggle: enrutar */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <span className="text-sm font-medium leading-snug text-muted-foreground">
            ¿Enrutar este cliente al finalizar el registro?
          </span>
          <button
            aria-checked={enrutar}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
              enrutar ? "bg-primary" : "bg-muted"
            }`}
            onClick={() => setEnrutar((v) => !v)}
            role="switch"
            type="button"
          >
            <span
              className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                enrutar ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <input name="enrutar" type="hidden" value={enrutar ? "1" : "0"} />
        </div>

        {/* ── Credit card preview ── */}
        <CreditCardPreview
          alias={alias}
          nit={nit}
          direccion1={direccion1}
          cuota={preview.cuota}
          total={preview.total}
          modalidad={modalidadLabel[modalidad]}
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
        {pending ? "Guardando…" : "Crear cliente y préstamo"}
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
  nit: string;
  direccion1: string;
  cuota: number;
  total: number;
  modalidad: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-primary to-green-900 p-5 text-white shadow-xl shadow-primary/30"
      style={{ aspectRatio: "86/54" }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 right-8 h-36 w-36 rounded-full bg-white/5" />
      <div className="absolute -left-6 bottom-4 h-24 w-24 rounded-full bg-black/10" />

      {/* Top row: brand + chip */}
      <div className="relative flex items-start justify-between">
        <span className="text-[11px] font-black tracking-[0.2em] text-white/80 uppercase">
          DinoPay
        </span>
        {/* Chip */}
        <div className="grid h-6 w-8 grid-cols-3 grid-rows-3 gap-[2px] rounded-[3px] bg-yellow-300/90 p-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-[1px] bg-yellow-500/60" />
          ))}
        </div>
      </div>

      {/* Center: cuota + plazo */}
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

      {/* Dirección */}
      <p className="relative mt-2 truncate text-[9px] font-semibold text-white/70">
        {direccion1 || "Dirección —"}
      </p>

      {/* Bottom row: name + nit + total */}
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
