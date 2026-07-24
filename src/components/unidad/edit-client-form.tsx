"use client";

import { Loader2, Save } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UpdateClientState } from "@/lib/actions/unidad/clients";

type Action = (prev: UpdateClientState, formData: FormData) => Promise<UpdateClientState>;

type ClientDefaults = {
  clientId: string;
  loanId: string;
  alias: string;
  nit: string | null;
  direccion1: string | null;
  direccion2: string | null;
  barrio: string | null;
  telefono1: string | null;
  telefono2: string | null;
};

const initialState: UpdateClientState = { ok: false, message: "" };

export function EditClientForm({
  updateClient,
  defaults
}: {
  updateClient: Action;
  defaults: ClientDefaults;
}) {
  const [state, formAction, pending] = useActionState(updateClient, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input name="clientId" type="hidden" value={defaults.clientId} />
      <input name="loanId" type="hidden" value={defaults.loanId} />

      <Card>
        <CardHeader>
          <CardTitle>Identificacion</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre / Alias *">
            <Input defaultValue={defaults.alias} name="alias" required />
          </Field>
          <Field label="NIT / Documento">
            <Input defaultValue={defaults.nit ?? ""} name="nit" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telefono</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefono 1">
            <Input defaultValue={defaults.telefono1 ?? ""} name="telefono1" type="tel" />
          </Field>
          <Field label="Telefono 2">
            <Input defaultValue={defaults.telefono2 ?? ""} name="telefono2" type="tel" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicacion</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Direccion 1">
            <Input defaultValue={defaults.direccion1 ?? ""} name="direccion1" />
          </Field>
          <Field label="Direccion 2">
            <Input defaultValue={defaults.direccion2 ?? ""} name="direccion2" />
          </Field>
          <Field label="Barrio">
            <Input defaultValue={defaults.barrio ?? ""} name="barrio" />
          </Field>
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

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
