"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { changeUnitPasswordAction } from "@/lib/actions/admin/unit-hub";

type UnitInfo = {
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

export function UnitConfigTab({ unit }: { unit: UnitInfo }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
        <p className="font-semibold">Información de la ruta</p>
        <div className="space-y-1.5 text-sm">
          <Row label="Nombre" value={unit.nombre_unidad} />
          <Row label="Usuario" value={`@${unit.username}`} />
          <Row label="Encargado" value={unit.encargado} />
          {unit.telefono ? <Row label="Teléfono" value={unit.telefono} /> : null}
          <Row label="Ciudad" value={unit.ciudad} />
          <Row label="Zona horaria" value={unit.zona_horaria} />
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
        <p className="font-semibold">Configuración operativa</p>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Intereses habilitados</p>
          <div className="flex flex-wrap gap-2">
            {unit.intereses.map((i) => (
              <span
                className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
                key={i}
              >
                {i}%
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Días laborales</p>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <span
                className={
                  unit.dias_laborales.includes(d)
                    ? "rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white"
                    : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                }
                key={d}
              >
                {DIA_LABELS[d]}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Permisos</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={
                  unit.puede_eliminar_abonos
                    ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                    : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                }
              >
                {unit.puede_eliminar_abonos ? "Sí" : "No"}
              </span>
              <span>Puede eliminar abonos</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  unit.puede_eliminar_prestamos
                    ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                    : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                }
              >
                {unit.puede_eliminar_prestamos ? "Sí" : "No"}
              </span>
              <span>Puede eliminar préstamos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
        <p className="font-semibold">Acciones</p>

        <Link
          className="flex h-10 w-full items-center justify-center rounded-xl bg-muted font-medium text-foreground text-sm hover:bg-muted/80"
          href={`/admin/unidades/${unit.id}/editar`}
        >
          Editar configuración
        </Link>
        <Link
          className="flex h-10 w-full items-center justify-center rounded-xl bg-muted font-medium text-foreground text-sm hover:bg-muted/80"
          href={`/admin/unidades/${unit.id}/reportes`}
        >
          Ver reportes
        </Link>

        <div className="border-t pt-3">
          <button
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            <span>Cambiar contraseña</span>
            <span className="text-muted-foreground">{showPassword ? "▲" : "▼"}</span>
          </button>

          {showPassword ? (
            <ChangePasswordForm unitId={unit.id} />
          ) : null}
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
    <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
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
