"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UpdateAjusteState } from "@/lib/actions/unidad/ajustes";

type Action = (prev: UpdateAjusteState, formData: FormData) => Promise<UpdateAjusteState>;

type Defaults = {
  ajusteId: string;
  semanaInicio: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string | null;
  fecha: string;
};

const initial: UpdateAjusteState = { ok: false, message: "" };

export function EditAjusteForm({
  updateAjuste,
  defaults
}: {
  updateAjuste: Action;
  defaults: Defaults;
}) {
  const [state, formAction, pending] = useActionState(updateAjuste, initial);
  const [tipo, setTipo] = useState<"ingreso" | "egreso">(defaults.tipo);

  return (
    <form action={formAction} className="space-y-5">
      <input name="ajusteId" type="hidden" value={defaults.ajusteId} />
      <input name="semanaInicio" type="hidden" value={defaults.semanaInicio} />

      <Card>
        <CardHeader>
          <CardTitle>Datos del ajuste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-md border py-2.5 text-sm font-medium transition-colors ${tipo === "ingreso" ? "border-green-500 bg-green-50 text-green-800" : "border-input bg-background text-muted-foreground"}`}
              onClick={() => setTipo("ingreso")}
              type="button"
            >
              ↑ Ingreso
            </button>
            <button
              className={`rounded-md border py-2.5 text-sm font-medium transition-colors ${tipo === "egreso" ? "border-red-400 bg-red-50 text-red-800" : "border-input bg-background text-muted-foreground"}`}
              onClick={() => setTipo("egreso")}
              type="button"
            >
              ↓ Egreso
            </button>
          </div>
          <input name="tipo" type="hidden" value={tipo} />

          <label className="block space-y-2 text-sm font-medium">
            <span>Monto</span>
            <Input
              defaultValue={defaults.monto}
              inputMode="decimal"
              min="0.01"
              name="monto"
              required
              step="0.01"
              type="number"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Descripcion</span>
            <Input
              defaultValue={defaults.descripcion ?? ""}
              name="descripcion"
              placeholder="Opcional"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Fecha</span>
            <Input defaultValue={defaults.fecha} name="fecha" required type="date" />
          </label>
        </CardContent>
      </Card>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar cambios
      </Button>
    </form>
  );
}
