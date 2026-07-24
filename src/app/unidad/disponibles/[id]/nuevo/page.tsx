import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExistingClientLoanForm } from "@/components/unidad/existing-client-loan-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createExistingClientLoanAction } from "@/lib/actions/unidad/nuevo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
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

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const [{ data: unit }, { data: client }, { data: activeLoan }, { data: loans }] =
    await Promise.all([
      adminClient.from("units").select("intereses").eq("id", user.id).maybeSingle(),
      adminClient
        .from("clients")
        .select("id, alias, direccion1, barrio, telefono1")
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

  if (!client) {
    notFound();
  }

  const interests = Array.isArray(unit?.intereses)
    ? unit.intereses.filter((item): item is number => typeof item === "number")
    : [];
  const lastLoan = (loans?.[0] ?? null) as LastLoan | null;
  const defaultInterest =
    lastLoan && interests.includes(Number(lastLoan.interes))
      ? Number(lastLoan.interes)
      : interests[0] ?? 10;
  const defaults = {
    modalidad: lastLoan?.modalidad ?? "diaria",
    interes: defaultInterest,
    valorNeto: Number(lastLoan?.valor_neto ?? 100000),
    numeroCuotas: Number(lastLoan?.numero_cuotas ?? 20)
  };

  return (
    <div className="space-y-4">
      <Button asChild size="sm" variant="ghost">
        <Link href="/unidad/disponibles">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">{client.alias}</h1>
        <p className="text-sm text-muted-foreground">
          {[client.direccion1, client.barrio].filter(Boolean).join(", ") ||
            "Cliente disponible"}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Star className="h-4 w-4 text-primary" />
            Cliente recurrente
          </p>
          <p className="text-sm text-muted-foreground">
            {activeLoan
              ? "Este cliente ya tiene un prestamo activo."
              : "Sin prestamo activo. Puedes crear uno nuevo con datos prellenados."}
          </p>
        </CardContent>
      </Card>

      {activeLoan ? (
        <Button asChild className="h-12 w-full">
          <Link href="/unidad/prestamos">Ir a prestamos</Link>
        </Button>
      ) : (
        <ExistingClientLoanForm
          action={createExistingClientLoanAction}
          clientId={client.id}
          defaults={defaults}
          interests={interests}
        />
      )}
    </div>
  );
}
