"use client";

import { Calculator, Loader2, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type State = {
  ok: boolean;
  message: string;
};

type Action = (previousState: State, formData: FormData) => Promise<State>;

const initialState: State = {
  ok: false,
  message: ""
};

type Defaults = {
  modalidad: string;
  interes: number;
  valorNeto: number;
  numeroCuotas: number;
};

export function ExistingClientLoanForm({
  action,
  clientId,
  defaults,
  interests
}: {
  action: Action;
  clientId: string;
  defaults: Defaults;
  interests: number[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [valorNeto, setValorNeto] = useState(defaults.valorNeto);
  const [numeroCuotas, setNumeroCuotas] = useState(defaults.numeroCuotas);
  const [interes, setInteres] = useState(defaults.interes);

  const preview = useMemo(() => {
    const total = valorNeto * (1 + interes / 100);
    const cuota = numeroCuotas > 0 ? total / numeroCuotas : 0;
    return { total, cuota };
  }, [interes, numeroCuotas, valorNeto]);

  return (
    <form action={formAction} className="space-y-4">
      <input name="clientId" type="hidden" value={clientId} />
      <Card>
        <CardHeader>
          <CardTitle>Datos del prestamo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">Modalidad</span>
            <select
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.modalidad}
              name="modalidad"
              required
            >
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Interes</span>
            <select
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              name="interes"
              onChange={(event) => setInteres(Number(event.target.value))}
              required
              value={interes}
            >
              {interests.map((item) => (
                <option key={item} value={item}>
                  {item}%
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Valor neto</span>
            <Input
              min="1"
              name="valorNeto"
              onChange={(event) => setValorNeto(Number(event.target.value))}
              required
              type="number"
              value={valorNeto}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Numero de cuotas</span>
            <Input
              min="1"
              name="numeroCuotas"
              onChange={(event) => setNumeroCuotas(Number(event.target.value))}
              required
              type="number"
              value={numeroCuotas}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PreviewRow label="Total a cobrar" value={formatCurrency(preview.total || 0)} />
          <PreviewRow label="Valor cuota" value={formatCurrency(preview.cuota || 0)} />
          <PreviewRow label="Cuotas" value={String(numeroCuotas || 0)} />
        </CardContent>
      </Card>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button className="h-12 w-full" disabled={pending || interests.length === 0} type="submit">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar prestamo
      </Button>
    </form>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}
