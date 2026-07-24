"use client";

import { Loader2, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AjusteState } from "@/lib/actions/unidad/ajustes";

type Action = (prev: AjusteState, formData: FormData) => Promise<AjusteState>;

const initialState: AjusteState = { ok: false, message: "" };

export function NuevoAjusteForm({
  createAjuste,
  semanaInicio,
  today
}: {
  createAjuste: Action;
  semanaInicio: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(createAjuste, initialState);
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("egreso");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo ajuste
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input name="semanaInicio" type="hidden" value={semanaInicio} />

          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-md border py-2.5 text-sm font-medium transition-colors ${
                tipo === "ingreso"
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-input bg-background text-muted-foreground"
              }`}
              onClick={() => setTipo("ingreso")}
              type="button"
            >
              ↑ Ingreso
            </button>
            <button
              className={`rounded-md border py-2.5 text-sm font-medium transition-colors ${
                tipo === "egreso"
                  ? "border-red-400 bg-red-50 text-red-800"
                  : "border-input bg-background text-muted-foreground"
              }`}
              onClick={() => setTipo("egreso")}
              type="button"
            >
              ↓ Egreso
            </button>
          </div>
          <input name="tipo" type="hidden" value={tipo} />

          <label className="block space-y-2 text-sm font-medium">
            <span>Monto</span>
            <Input inputMode="decimal" min="0.01" name="monto" placeholder="0" required step="0.01" type="number" />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Descripcion</span>
            <Input name="descripcion" placeholder="Ej: Pago arriendo" />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Fecha</span>
            <Input defaultValue={today} max={today} name="fecha" required type="date" />
          </label>

          {state.message ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <Button className="w-full" disabled={pending} type="submit">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Guardar ajuste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
