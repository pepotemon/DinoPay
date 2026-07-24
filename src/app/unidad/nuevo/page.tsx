import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NuevoClienteForm } from "@/components/unidad/nuevo-cliente-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientLoanAction } from "@/lib/actions/unidad/nuevo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Shell síncrono — renderiza al instante
export default function NuevoPrestamoPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cliente y préstamo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea el cliente y su primer préstamo en un solo flujo.
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <FormWithData />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente async — los datos streaman sin bloquear el shell
async function FormWithData() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("intereses")
    .eq("id", user.id)
    .maybeSingle();

  const interests = Array.isArray(unit?.intereses)
    ? unit.intereses.filter((item): item is number => typeof item === "number")
    : [];

  if (interests.length === 0) {
    return (
      <p className="text-sm text-destructive">
        Esta unidad no tiene intereses habilitados.
      </p>
    );
  }

  return <NuevoClienteForm createClientLoan={createClientLoanAction} interests={interests} />;
}

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-20 rounded bg-muted" />
            <div className="h-10 rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-px bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-20 rounded bg-muted" />
            <div className="h-10 rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-24 rounded-md bg-muted" />
      <div className="h-10 w-full rounded-md bg-muted" />
    </div>
  );
}
