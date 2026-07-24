"use client";

import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CreateUnitState = {
  ok: boolean;
  message: string;
  credentials?: {
    username: string;
    loginEmail: string;
  };
};

type CreateUnitAction = (
  previousState: CreateUnitState,
  formData: FormData
) => Promise<CreateUnitState>;

const initialState: CreateUnitState = {
  ok: false,
  message: ""
};

const workDays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mie" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" }
];

export function CreateUnitForm({ createUnit }: { createUnit: CreateUnitAction }) {
  const [state, formAction, pending] = useActionState(createUnit, initialState);
  const [password, setPassword] = useState("DinoPay2026");
  const [confirmPassword, setConfirmPassword] = useState("DinoPay2026");

  return (
    <form action={formAction} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Username">
          <Input autoComplete="off" name="username" placeholder="unidad_norte" required />
        </Field>
        <Field label="Nombre de la unidad">
          <Input name="nombreUnidad" placeholder="Unidad Norte" required />
        </Field>
        <Field label="Contrasena">
          <Input
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </Field>
        <Field label="Repetir contrasena">
          <Input
            name="confirmPassword"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Encargado">
          <Input name="encargado" placeholder="Nombre del encargado" required />
        </Field>
        <Field label="Telefono">
          <Input name="telefono" placeholder="+57..." type="tel" />
        </Field>
        <Field label="Capital inicial">
          <Input min="0" name="capitalInicial" required step="0.01" type="number" />
        </Field>
        <Field label="Intereses habilitados">
          <Input name="intereses" placeholder="10,15,20" required />
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Pais">
          <Input defaultValue="Colombia" name="pais" required />
        </Field>
        <Field label="Estado/Dpto.">
          <Input name="estado" placeholder="Antioquia" required />
        </Field>
        <Field label="Ciudad">
          <Input name="ciudad" placeholder="Medellin" required />
        </Field>
        <Field label="Zona horaria">
          <Input defaultValue="America/Bogota" name="zonaHoraria" required />
        </Field>
        <Field label="Dias bloqueados para eliminar pagos">
          <Input defaultValue="0" min="0" name="diasBloqueadosEliminacion" type="number" />
        </Field>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium">Dias laborales</p>
        <div className="flex flex-wrap gap-2">
          {workDays.map((day) => (
            <label
              className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm"
              key={day.value}
            >
              <input
                className="h-4 w-4 accent-primary"
                defaultChecked={day.value >= 1 && day.value <= 5}
                name="diasLaborales"
                type="checkbox"
                value={day.value}
              />
              {day.label}
            </label>
          ))}
        </div>
      </section>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-md border border-primary/30 bg-primary/10 p-4 text-sm"
              : "rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          }
        >
          <div className="flex items-start gap-2">
            {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : null}
            <div className="space-y-2">
              <p>{state.message}</p>
              {state.credentials ? (
                <div className="space-y-1 text-foreground">
                  <p>
                    Usuario: <strong>{state.credentials.username}</strong>
                  </p>
                  <p>
                    Email interno: <strong>{state.credentials.loginEmail}</strong>
                  </p>
                  <Button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Usuario: ${state.credentials?.username}\nContrasena: ${password}`
                      )
                    }
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar credenciales
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Crear unidad
      </Button>
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
