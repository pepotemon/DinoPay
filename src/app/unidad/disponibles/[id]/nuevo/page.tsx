import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExistingClientLoanForm } from "@/components/unidad/existing-client-loan-form";
import { createExistingClientLoanAction } from "@/lib/actions/unidad/nuevo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUnitMeta } from "@/lib/data/unit";

type PageProps = {
  params: Promise<{ id: string }>;
};

type LastLoan = {
  modalidad: string;
  interes: number;
  valor_neto: number;
  numero_cuotas: number;
};

export default async function NuevoPrestamoClientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const [unit, { data: client }, { data: activeLoan }, { data: loans }] = await Promise.all([
    getUnitMeta(user.id),
    adminClient
      .from("clients")
      .select("id, alias, nit, direccion1, barrio, telefono1")
      .eq("id", id)
      .eq("unit_id", user.id)
      .eq("activo", true)
      .maybeSingle(),
    adminClient
      .from("loans")
      .select("id")
      .eq("client_id", id)
      .eq("estado", "activo")
      .maybeSingle(),
    adminClient
      .from("loans")
      .select("modalidad, interes, valor_neto, numero_cuotas")
      .eq("client_id", id)
      .eq("unit_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  if (!client) notFound();

  const interests = Array.isArray(unit?.intereses)
    ? (unit.intereses as unknown[]).filter((item): item is number => typeof item === "number")
    : [];

  const lastLoan = (loans?.[0] ?? null) as LastLoan | null;
  const defaultInterest =
    lastLoan && interests.includes(Number(lastLoan.interes))
      ? Number(lastLoan.interes)
      : (interests[0] ?? 10);

  const defaults = {
    modalidad: lastLoan?.modalidad ?? "diaria",
    interes: defaultInterest,
    valorNeto: Number(lastLoan?.valor_neto ?? 100000),
    numeroCuotas: Number(lastLoan?.numero_cuotas ?? 20)
  };

  const address = [client.direccion1, client.barrio].filter(Boolean).join(", ");

  return (
    <div className="pb-6">
      {/* Back */}
      <div className="px-1 pb-4 pt-2">
        <Link
          href="/unidad/disponibles"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Disponibles
        </Link>
      </div>

      {/* Hero */}
      <div className="px-1 pb-6">
        <h1 className="text-4xl font-black leading-tight">{client.alias}</h1>
        <p className="text-lg font-bold text-primary">Nuevo préstamo</p>
      </div>

      {/* Client info card */}
      <div className="mb-4 rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
            {client.alias
              .split(" ")
              .slice(0, 2)
              .map((w: string) => w[0]?.toUpperCase() ?? "")
              .join("") || "?"}
          </div>
          <div className="min-w-0">
            {client.nit ? (
              <p className="text-xs text-muted-foreground">{client.nit}</p>
            ) : null}
            {client.telefono1 ? (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {client.telefono1}
              </p>
            ) : null}
            {address ? (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{address}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {activeLoan ? (
        <div className="space-y-4">
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            Este cliente ya tiene un préstamo activo.
          </p>
          <Link
            href="/unidad/prestamos"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25"
          >
            Ir a préstamos
          </Link>
        </div>
      ) : (
        <ExistingClientLoanForm
          action={createExistingClientLoanAction}
          clientId={client.id}
          clientAlias={client.alias}
          clientNit={client.nit ?? null}
          clientDireccion1={client.direccion1 ?? null}
          defaults={defaults}
          interests={interests}
        />
      )}
    </div>
  );
}
