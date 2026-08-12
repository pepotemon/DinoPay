"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { ChevronDown, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RouteSelector } from "@/components/admin/route-selector";
import {
  updateUnitInfoInlineAction,
  updateUnitOperativeInlineAction,
  changeUnitPasswordInlineAction
} from "@/lib/actions/admin/unit-hub";

type UnitFull = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  telefono: string | null;
  pais: string;
  estado: string;
  ciudad: string;
  zona_horaria: string;
  capital_inicial: number;
  activo: boolean;
  intereses: number[];
  dias_laborales: number[];
  puede_eliminar_abonos: boolean;
  puede_eliminar_prestamos: boolean;
};

const DIA_LABELS: Record<number, string> = {
  0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb"
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function UnidadConfiguracionClient({
  unit,
  units
}: {
  unit: UnitFull;
  units: { id: string; nombre_unidad: string; activo: boolean }[];
}) {
  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            className="lg:hidden inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80 mb-3"
            href="/admin/unidades"
          >
            ← Unidades
          </Link>
          <h1 className="text-2xl font-semibold">Configuración</h1>
          <p className="text-sm text-muted-foreground">{unit.nombre_unidad}</p>
        </div>
        <RouteSelector units={units} currentUnitId={unit.id} currentUnitName={unit.nombre_unidad} />
      </div>

      <InfoSection unit={unit} />
      <OperativeSection unit={unit} />
      <SecuritySection unitId={unit.id} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function SectionAccordion({
  title,
  summary,
  open,
  onToggle,
  children
}: {
  title: string;
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{title}</p>
          {!open && summary ? (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{summary}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="border-t px-4 pb-5 pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={cn("text-xs font-medium", msg.ok ? "text-green-700" : "text-destructive")}>
      {msg.text}
    </p>
  );
}

function FieldInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1 text-xs font-medium">
      <span>{label}</span>
      <input
        className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...props}
      />
    </label>
  );
}

function SaveRow({
  pending,
  msg,
  label = "Guardar"
}: {
  pending: boolean;
  msg: { ok: boolean; text: string } | null;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <Msg msg={msg} />
      <button
        type="submit"
        disabled={pending}
        className="ml-auto h-9 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {pending ? "Guardando…" : label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info section
// ---------------------------------------------------------------------------

function InfoSection({ unit }: { unit: UnitFull }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const res = await updateUnitInfoInlineAction(fd);
      setMsg(res?.error ? { ok: false, text: res.error } : { ok: true, text: "Guardado ✓" });
    });
  }

  const summary = [unit.encargado, unit.ciudad, unit.pais].filter(Boolean).join(" · ");

  return (
    <SectionAccordion
      title="Información de la ruta"
      summary={summary}
      open={open}
      onToggle={() => { setOpen(!open); setMsg(null); }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="unitId" value={unit.id} />

        <FieldInput label="Nombre de la ruta" name="nombreUnidad" defaultValue={unit.nombre_unidad} required />
        <FieldInput label="Encargado" name="encargado" defaultValue={unit.encargado} required />
        <FieldInput label="Teléfono" name="telefono" type="tel" defaultValue={unit.telefono ?? ""} />

        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="País" name="pais" defaultValue={unit.pais} required />
          <FieldInput label="Estado / Depto." name="estado" defaultValue={unit.estado} />
        </div>

        <FieldInput label="Ciudad" name="ciudad" defaultValue={unit.ciudad} required />
        <FieldInput label="Zona horaria" name="zonaHoraria" defaultValue={unit.zona_horaria} required />

        <SaveRow pending={pending} msg={msg} />
      </form>
    </SectionAccordion>
  );
}

// ---------------------------------------------------------------------------
// Operative section
// ---------------------------------------------------------------------------

function OperativeSection({ unit }: { unit: UnitFull }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tags, setTags] = useState<number[]>(unit.intereses);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const n = parseFloat(inputVal.trim());
    if (!isNaN(n) && n > 0 && !tags.includes(n)) {
      setTags((prev) => [...prev, n].sort((a, b) => a - b));
    }
    setInputVal("");
    inputRef.current?.focus();
  }

  function removeTag(val: number) {
    setTags((prev) => prev.filter((t) => t !== val));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const res = await updateUnitOperativeInlineAction(fd);
      setMsg(res?.error ? { ok: false, text: res.error } : { ok: true, text: "Guardado ✓" });
    });
  }

  const summary = [
    tags.length ? tags.map((i) => `${i}%`).join(" ") : null,
    unit.dias_laborales.length ? unit.dias_laborales.map((d) => DIA_LABELS[d]).join(" ") : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SectionAccordion
      title="Configuración operativa"
      summary={summary || "Sin configurar"}
      open={open}
      onToggle={() => { setOpen(!open); setMsg(null); }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="unitId" value={unit.id} />
        <input type="hidden" name="intereses" value={tags.join(",")} />

        {/* Interest tag input */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Tasas de interés</p>

          {/* Pills */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
                >
                  {t}%
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="flex items-center justify-center rounded-full hover:bg-green-200 transition-colors"
                    aria-label={`Quitar ${t}%`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              min="0.01"
              step="any"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: 10"
              className="h-9 w-28 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={addTag}
              className="h-9 rounded-xl bg-muted px-3 text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              + Agregar
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Escribe el número y presiona Enter o "+ Agregar"
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Días laborales</p>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((d) => (
              <label
                key={d}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  name="diasLaborales"
                  value={d}
                  defaultChecked={unit.dias_laborales.includes(d)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                {DIA_LABELS[d]}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Permisos</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="puedeEliminarAbonos"
                defaultChecked={unit.puede_eliminar_abonos}
                className="h-4 w-4 accent-primary"
              />
              Puede eliminar abonos
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="puedeEliminarPrestamos"
                defaultChecked={unit.puede_eliminar_prestamos}
                className="h-4 w-4 accent-primary"
              />
              Puede eliminar préstamos
            </label>
          </div>
        </div>

        <SaveRow pending={pending} msg={msg} />
      </form>
    </SectionAccordion>
  );
}

// ---------------------------------------------------------------------------
// Security section
// ---------------------------------------------------------------------------

function SecuritySection({ unitId }: { unitId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const res = await changeUnitPasswordInlineAction(fd);
      if (res?.error) {
        setMsg({ ok: false, text: res.error });
      } else {
        setMsg({ ok: true, text: "Contraseña actualizada ✓" });
        setFormKey((k) => k + 1);
      }
    });
  }

  return (
    <SectionAccordion
      title="Acceso y seguridad"
      summary="Cambiar contraseña"
      open={open}
      onToggle={() => { setOpen(!open); setMsg(null); }}
    >
      <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="unitId" value={unitId} />
        <FieldInput
          label="Nueva contraseña"
          name="password"
          type="password"
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          required
        />
        <FieldInput
          label="Confirmar contraseña"
          name="confirm"
          type="password"
          minLength={6}
          placeholder="Repite la contraseña"
          required
        />
        <SaveRow pending={pending} msg={msg} label="Guardar contraseña" />
      </form>
    </SectionAccordion>
  );
}
