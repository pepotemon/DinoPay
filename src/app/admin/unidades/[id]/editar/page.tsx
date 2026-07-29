import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateUnitAction } from "@/lib/actions/admin/unidades";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";

const workDays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mie" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" }
];

type UnitEditRow = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  telefono: string | null;
  capital_inicial: number;
  pais: string;
  estado: string;
  ciudad: string;
  zona_horaria: string;
  dias_laborales: number[];
  dias_bloqueados_eliminacion: number;
  puede_eliminar_abonos: boolean;
  puede_eliminar_prestamos: boolean;
  intereses: number[];
  activo: boolean;
};

export default async function EditarUnidadPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("units")
    .select(
      "id, username, nombre_unidad, encargado, telefono, capital_inicial, pais, estado, ciudad, zona_horaria, dias_laborales, dias_bloqueados_eliminacion, puede_eliminar_abonos, puede_eliminar_prestamos, intereses, activo"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const unit = data as UnitEditRow;
  const diasLaborales = Array.isArray(unit.dias_laborales) ? unit.dias_laborales.map(Number) : [];
  const intereses = Array.isArray(unit.intereses) ? unit.intereses.map(Number) : [];

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href={`/admin/unidades/${unit.id}`}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>

      <div>
        <p className="text-sm font-bold text-primary">@{unit.username}</p>
        <h1 className="text-2xl font-semibold">Editar unidad</h1>
        <p className="text-sm text-muted-foreground">
          Cambia permisos, intereses, dias laborales y datos operativos.
        </p>
      </div>

      {sp?.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {sp.error}
        </div>
      ) : null}

      <form action={updateUnitAction} className="space-y-5">
        <input name="unitId" type="hidden" value={unit.id} />

        <Card>
          <CardHeader>
            <CardTitle>Datos de la unidad</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre de la unidad">
              <Input defaultValue={unit.nombre_unidad} name="nombreUnidad" required />
            </Field>
            <Field label="Encargado">
              <Input defaultValue={unit.encargado} name="encargado" required />
            </Field>
            <Field label="Telefono">
              <Input defaultValue={unit.telefono ?? ""} name="telefono" type="tel" />
            </Field>
            <Field label="Capital inicial">
              <Input
                defaultValue={unit.capital_inicial}
                min="0"
                name="capitalInicial"
                required
                step="0.01"
                type="number"
              />
            </Field>
            <Field label="Pais">
              <Input defaultValue={unit.pais} name="pais" required />
            </Field>
            <Field label="Estado / Dpto.">
              <Input defaultValue={unit.estado} name="estado" required />
            </Field>
            <Field label="Ciudad">
              <Input defaultValue={unit.ciudad} name="ciudad" required />
            </Field>
            <Field label="Zona horaria">
              <Input defaultValue={unit.zona_horaria} name="zonaHoraria" required />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuracion operativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Intereses habilitados">
              <Input
                defaultValue={intereses.join(",")}
                name="intereses"
                placeholder="10,15,20"
                required
              />
            </Field>

            <Field label="Dias bloqueados para eliminar pagos">
              <Input
                defaultValue={unit.dias_bloqueados_eliminacion}
                min="0"
                name="diasBloqueadosEliminacion"
                type="number"
              />
            </Field>

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
                      defaultChecked={diasLaborales.includes(day.value)}
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
                <PermissionToggle
                  checked={unit.puede_eliminar_abonos}
                  description="La unidad solo podra anular abonos registrados hoy."
                  label="Eliminar abonos del dia"
                  name="puedeEliminarAbonos"
                />
                <PermissionToggle
                  checked={unit.puede_eliminar_prestamos}
                  description="Solo prestamos creados hoy y sin abonos."
                  label="Eliminar prestamos del dia"
                  name="puedeEliminarPrestamos"
                />
              </div>
            </section>

            <PermissionToggle
              checked={unit.activo}
              description="Si esta apagado, la unidad queda marcada como inactiva."
              label="Unidad activa"
              name="activo"
            />
          </CardContent>
        </Card>

        <Button className="w-full" type="submit">
          <Save className="h-4 w-4" />
          Guardar cambios
        </Button>
      </form>
    </div>
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

function PermissionToggle({
  checked,
  description,
  label,
  name
}: {
  checked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border px-3 py-3 text-sm">
      <input
        className="mt-0.5 h-4 w-4 accent-primary"
        defaultChecked={checked}
        name={name}
        type="checkbox"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
