import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateClientAction } from "@/lib/actions/admin/clients";

export default async function EditarClientePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; clientId: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id, clientId } = await params;
  const sp = await searchParams;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("clients")
    .select("id, alias, nit, telefono1, telefono2, direccion1, barrio")
    .eq("id", clientId)
    .eq("unit_id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="space-y-5 pb-8">
      <Link
        href={`/admin/unidades/${id}/clientes`}
        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
      >
        ← Clientes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Editar cliente</h1>
        <p className="text-sm text-muted-foreground uppercase font-medium">{data.alias}</p>
      </div>

      {sp?.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {sp.error}
        </div>
      ) : null}

      <form action={updateClientAction} className="space-y-4">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="unitId" value={id} />

        <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-4">
          <p className="font-semibold text-sm">Información del cliente</p>

          <Field label="Nombre / Alias *">
            <input
              name="alias"
              defaultValue={data.alias}
              required
              placeholder="Nombre del cliente"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label="NIT / Cédula">
            <input
              name="nit"
              defaultValue={data.nit ?? ""}
              placeholder="Documento de identidad"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label="Teléfono 1">
            <input
              name="telefono1"
              type="tel"
              defaultValue={data.telefono1 ?? ""}
              placeholder="Número de contacto"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label="Teléfono 2">
            <input
              name="telefono2"
              type="tel"
              defaultValue={data.telefono2 ?? ""}
              placeholder="Número alternativo"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label="Dirección">
            <input
              name="direccion1"
              defaultValue={data.direccion1 ?? ""}
              placeholder="Dirección del cliente"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label="Barrio">
            <input
              name="barrio"
              defaultValue={data.barrio ?? ""}
              placeholder="Barrio o sector"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary/90 transition-colors"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
