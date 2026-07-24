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

export function NuevoClienteForm({
  createClientLoan,
  interests
}: {
  createClientLoan: Action;
  interests: number[];
}) {
  const [state, formAction, pending] = useActionState(createClientLoan, initialState);
  const [valorNeto, setValorNeto] = useState(100000);
  const [numeroCuotas, setNumeroCuotas] = useState(20);
  const [interes, setInteres] = useState(interests[0] ?? 10);

  const preview = useMemo(() => {
    const total = valorNeto * (1 + interes / 100);
    const cuota = numeroCuotas > 0 ? total / numeroCuotas : 0;
    return { total, cuota };
  }, [interes, numeroCuotas, valorNeto]);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre/Alias">
              <Input name="alias" placeholder="Maria tienda azul" required />
            </Field>
            <Field label="NIT / Documento">
              <Input name="nit" />
            </Field>
            <Field label="Direccion 1">
              <Input name="direccion1" />
            </Field>
            <Field label="Direccion 2">
              <Input name="direccion2" />
            </Field>
            <Field label="Barrio">
              <Input name="barrio" />
            </Field>
            <Field label="Genero">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="genero"
              >
                <option value="">Sin especificar</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <Field label="Telefono 1">
              <Input name="telefono1" type="tel" />
            </Field>
            <Field label="Telefono 2">
              <Input name="telefono2" type="tel" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prestamo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Modalidad">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                name="modalidad"
                required
              >
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </Field>
            <Field label="Interes">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            </Field>
            <Field label="Valor neto">
              <Input
                min="1"
                name="valorNeto"
                onChange={(event) => setValorNeto(Number(event.target.value))}
                required
                type="number"
                value={valorNeto}
              />
            </Field>
            <Field label="Numero de cuotas">
              <Input
                min="1"
                name="numeroCuotas"
                onChange={(event) => setNumeroCuotas(Number(event.target.value))}
                required
                type="number"
                value={numeroCuotas}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PreviewRow label="Valor prestado" value={formatCurrency(valorNeto || 0)} />
            <PreviewRow label="Interes" value={`${interes}%`} />
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

        <Button className="w-full" disabled={pending || interests.length === 0} type="submit">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </aside>
    </form>
  );
}

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
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
