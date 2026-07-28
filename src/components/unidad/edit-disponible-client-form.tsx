"use client";

import { Building2, CreditCard, Home, MapPin, Phone, User } from "lucide-react";
import { useActionState } from "react";
import type { UpdateClientState } from "@/lib/actions/unidad/clients";

type Action = (prev: UpdateClientState, formData: FormData) => Promise<UpdateClientState>;

type ClientDefaults = {
  clientId: string;
  alias: string;
  nit: string | null;
  direccion1: string | null;
  direccion2: string | null;
  barrio: string | null;
  telefono1: string | null;
  telefono2: string | null;
};

const INPUT =
  "h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20";

export function EditDisponibleClientForm({
  action,
  defaults
}: {
  action: Action;
  defaults: ClientDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });

  return (
    <form action={formAction} className="space-y-4">
      <input name="clientId" type="hidden" value={defaults.clientId} />

      {/* ── IDENTIFICACIÓN ── */}
      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <SectionHead icon={<User className="h-4 w-4" />} label="Identificación" />

        <FieldRow label="Nombre" required icon={<User className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="alias"
            placeholder="Nombre y Apellido"
            required
            defaultValue={defaults.alias}
          />
        </FieldRow>

        <FieldRow label="NIT / Cédula" icon={<CreditCard className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="nit"
            placeholder="Documento"
            defaultValue={defaults.nit ?? ""}
          />
        </FieldRow>

        <FieldRow label="Teléfono 1" icon={<Phone className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="telefono1"
            placeholder="Número"
            type="tel"
            defaultValue={defaults.telefono1 ?? ""}
          />
        </FieldRow>

        <FieldRow label="Teléfono 2" icon={<Phone className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="telefono2"
            placeholder="Alternativo"
            type="tel"
            defaultValue={defaults.telefono2 ?? ""}
          />
        </FieldRow>
      </section>

      {/* ── DOMICILIO ── */}
      <section className="space-y-4 rounded-2xl border bg-background p-5 shadow-sm">
        <SectionHead icon={<MapPin className="h-4 w-4" />} label="Domicilio" />

        <FieldRow label="Dirección 1" icon={<Home className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="direccion1"
            placeholder="Calle, Carrera, Av…"
            defaultValue={defaults.direccion1 ?? ""}
          />
        </FieldRow>

        <FieldRow label="Dirección 2" icon={<Building2 className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="direccion2"
            placeholder="Apto, Local, Casa…"
            defaultValue={defaults.direccion2 ?? ""}
          />
        </FieldRow>

        <FieldRow label="Barrio" icon={<MapPin className="h-4 w-4 text-primary/50" />}>
          <input
            className={INPUT}
            name="barrio"
            placeholder="Barrio o zona"
            defaultValue={defaults.barrio ?? ""}
          />
        </FieldRow>
      </section>

      {/* Error */}
      {state.message ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {state.message}
        </p>
      ) : null}

      <button
        className="h-14 w-full rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-opacity disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
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
