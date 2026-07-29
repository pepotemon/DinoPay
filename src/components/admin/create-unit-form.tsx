"use client";

import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Country, State, City } from "country-state-city";
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

const initialState: CreateUnitState = { ok: false, message: "" };

const workDays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mie" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" }
];

const allCountries = Country.getAllCountries();

// Mapeo manual para países con múltiples zonas horarias en LATAM
const STATE_TIMEZONES: Record<string, Record<string, string>> = {
  BR: {
    AC: "America/Rio_Branco",
    AM: "America/Manaus",
    RR: "America/Boa_Vista",
    RO: "America/Porto_Velho",
    PA: "America/Belem",
    AP: "America/Belem",
    TO: "America/Araguaina",
    MA: "America/Fortaleza",
    PI: "America/Fortaleza",
    CE: "America/Fortaleza",
    RN: "America/Fortaleza",
    PB: "America/Fortaleza",
    PE: "America/Recife",
    AL: "America/Maceio",
    SE: "America/Maceio",
    BA: "America/Bahia",
    MT: "America/Cuiaba",
    MS: "America/Campo_Grande",
    GO: "America/Sao_Paulo",
    DF: "America/Sao_Paulo",
    MG: "America/Sao_Paulo",
    ES: "America/Sao_Paulo",
    RJ: "America/Sao_Paulo",
    SP: "America/Sao_Paulo",
    PR: "America/Sao_Paulo",
    SC: "America/Sao_Paulo",
    RS: "America/Sao_Paulo"
  },
  MX: {
    BC: "America/Tijuana",
    BS: "America/Mazatlan",
    SI: "America/Mazatlan",
    SO: "America/Hermosillo",
    CH: "America/Chihuahua",
    NA: "America/Bahia_Banderas",
    QR: "America/Cancun"
  }
};

export function CreateUnitForm({ createUnit }: { createUnit: CreateUnitAction }) {
  const [state, formAction, pending] = useActionState(createUnit, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [timezone, setTimezone] = useState("");

  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = selectedCountry && selectedState
    ? City.getCitiesOfState(selectedCountry, selectedState)
    : [];

  function handleCountryChange(code: string) {
    setSelectedCountry(code);
    setSelectedState("");
    setSelectedCity("");
    const country = allCountries.find((c) => c.isoCode === code);
    const tz = country?.timezones?.[0]?.zoneName ?? "";
    setTimezone(tz);
  }

  function handleStateChange(stateCode: string) {
    setSelectedState(stateCode);
    setSelectedCity("");
    const stateSpecificTz = STATE_TIMEZONES[selectedCountry]?.[stateCode];
    if (stateSpecificTz) setTimezone(stateSpecificTz);
  }

  const selectedCountryName = allCountries.find((c) => c.isoCode === selectedCountry)?.name ?? "";

  return (
    <form action={formAction} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Username">
          <Input autoComplete="off" name="username" placeholder="unidad_norte" required />
        </Field>
        <Field label="Nombre de la unidad">
          <Input name="nombreUnidad" placeholder="Unidad Norte" required />
        </Field>
        <Field label="Contraseña">
          <Input
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </Field>
        <Field label="Repetir contraseña">
          <Input
            name="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
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
        <Field label="Teléfono">
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
        {/* País */}
        <Field label="País">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            onChange={(e) => handleCountryChange(e.target.value)}
            required
            value={selectedCountry}
          >
            <option value="">Selecciona un país</option>
            {allCountries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {/* Campos ocultos para el server action */}
          <input name="pais" type="hidden" value={selectedCountryName} />
          <input name="paisCodigo" type="hidden" value={selectedCountry} />
        </Field>

        {/* Estado / Departamento */}
        <Field label="Estado / Dpto.">
          {states.length > 0 ? (
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
              disabled={!selectedCountry}
              onChange={(e) => handleStateChange(e.target.value)}
              required
              value={selectedState}
            >
              <option value="">Selecciona un estado</option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              disabled={!selectedCountry}
              name="estado"
              placeholder="Estado o departamento"
              required
            />
          )}
          {states.length > 0 ? (
            <input
              name="estado"
              type="hidden"
              value={states.find((s) => s.isoCode === selectedState)?.name ?? ""}
            />
          ) : null}
        </Field>

        {/* Ciudad */}
        <Field label="Ciudad">
          {cities.length > 0 ? (
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
              disabled={!selectedState}
              onChange={(e) => setSelectedCity(e.target.value)}
              required
              value={selectedCity}
            >
              <option value="">Selecciona una ciudad</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              disabled={!selectedCountry}
              name="ciudad"
              placeholder="Ciudad"
              required
            />
          )}
          {cities.length > 0 ? (
            <input name="ciudad" type="hidden" value={selectedCity} />
          ) : null}
        </Field>

        {/* Zona horaria — se auto-rellena con país/estado */}
        <Field label="Zona horaria">
          <Input
            className="bg-muted text-muted-foreground"
            name="zonaHoraria"
            placeholder="Se completa al elegir el país"
            readOnly
            required
            value={timezone}
          />
        </Field>

      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium">Días laborales</p>
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

      <section className="space-y-2">
        <p className="text-sm font-medium">Permisos de eliminacion</p>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-md border px-3 py-3 text-sm">
            <input className="mt-0.5 h-4 w-4 accent-primary" name="puedeEliminarAbonos" type="checkbox" />
            <span>
              <span className="block font-medium">Eliminar abonos del dia</span>
              <span className="text-xs text-muted-foreground">
                La unidad solo podra anular abonos registrados hoy.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-md border px-3 py-3 text-sm">
            <input className="mt-0.5 h-4 w-4 accent-primary" name="puedeEliminarPrestamos" type="checkbox" />
            <span>
              <span className="block font-medium">Eliminar prestamos del dia</span>
              <span className="text-xs text-muted-foreground">
                Solo prestamos creados hoy y sin abonos.
              </span>
            </span>
          </label>
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
                  <p>Usuario: <strong>{state.credentials.username}</strong></p>
                  <p>Email interno: <strong>{state.credentials.loginEmail}</strong></p>
                  <Button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Usuario: ${state.credentials?.username}\nContraseña: ${password}`
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

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
