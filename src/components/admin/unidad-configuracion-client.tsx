"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { changeUnitPasswordAction } from "@/lib/actions/admin/unit-hub";
import { cn } from "@/lib/utils";
import { RouteSelector } from "@/components/admin/route-selector";

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
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb"
};

export function UnidadConfiguracionClient({
  unit,
  units
}: {
  unit: UnitFull;
  units: { id: string; nombre_unidad: string; activo: boolean }[];
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-5 pb-8">
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

      {/* Info card */}
      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
        <p className="font-semibold">Información de la ruta</p>
        <div className="space-y-1.5 text-sm">
          <Row label="Nombre" value={unit.nombre_unidad} />
          <Row label="Usuario" value={`@${unit.username}`} />
          <Row label="Encargado" value={unit.encargado} />
          {unit.telefono ? <Row label="Teléfono" value={unit.telefono} /> : null}
          <Row label="País" value={unit.pais} />
          {unit.estado ? <Row label="Estado/Depto." value={unit.estado} /> : null}
          <Row label="Ciudad" value={unit.ciudad} />
          <Row label="Zona horaria" value={unit.zona_horaria} />
        </div>
        <Link
          href={`/admin/unidades/${unit.id}/editar`}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-muted font-medium text-foreground text-sm hover:bg-muted/80 transition-colors"
        >
          Editar información
        </Link>
      </div>

      {/* Operative config card */}
      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
        <p className="font-semibold">Configuración operativa</p>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Tasas de interés</p>
          <div className="flex flex-wrap gap-2">
            {unit.intereses.length === 0 ? (
              <span className="text-sm text-muted-foreground">Sin tasas configuradas</span>
            ) : (
              unit.intereses.map((i) => (
                <span
                  key={i}
                  className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
                >
                  {i}%
                </span>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Días laborales</p>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <span
                key={d}
                className={
                  unit.dias_laborales.includes(d)
                    ? "rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white"
                    : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                }
              >
                {DIA_LABELS[d]}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Permisos</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  unit.puede_eliminar_abonos
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {unit.puede_eliminar_abonos ? "Sí" : "No"}
              </span>
              <span>Puede eliminar abonos</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  unit.puede_eliminar_prestamos
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {unit.puede_eliminar_prestamos ? "Sí" : "No"}
              </span>
              <span>Puede eliminar préstamos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password card */}
      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
        <p className="font-semibold">Acceso y seguridad</p>
        <button
          className="flex w-full items-center justify-between text-sm font-medium py-1"
          onClick={() => setShowPassword(!showPassword)}
          type="button"
        >
          <span>Cambiar contraseña</span>
          <span className="text-muted-foreground text-xs">{showPassword ? "▲" : "▼"}</span>
        </button>
        {showPassword ? <ChangePasswordForm unitId={unit.id} /> : null}
      </div>

      {/* Quick actions card */}
      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
        <p className="font-semibold">Acciones rápidas</p>
        <div className="space-y-2">
          <Link
            href={`/admin/unidades/${unit.id}/reportes`}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-muted font-medium text-foreground text-sm hover:bg-muted/80 transition-colors"
          >
            Ver reportes
          </Link>
          <Link
            href={`/admin/unidades/${unit.id}/prestamos`}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-muted font-medium text-foreground text-sm hover:bg-muted/80 transition-colors"
          >
            Ver préstamos
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function ChangePasswordForm({ unitId }: { unitId: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => changeUnitPasswordAction(formData));
  }

  return (
    <form className="mt-2 space-y-3" onSubmit={handleSubmit}>
      <input name="unitId" type="hidden" value={unitId} />
      <label className="block space-y-1 text-xs font-medium">
        <span>Nueva contraseña</span>
        <input
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          minLength={6}
          name="password"
          placeholder="Mínimo 6 caracteres"
          required
          type="password"
        />
      </label>
      <label className="block space-y-1 text-xs font-medium">
        <span>Confirmar contraseña</span>
        <input
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          minLength={6}
          name="confirm"
          placeholder="Repite la contraseña"
          required
          type="password"
        />
      </label>
      <button
        className="h-10 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
