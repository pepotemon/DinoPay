import { redirect } from "next/navigation";
import { NuevoClienteForm } from "@/components/unidad/nuevo-cliente-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientLoanAction } from "@/lib/actions/unidad/nuevo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function NuevoPrestamoPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: unit } = await adminClient
    .from("units")
    .select("intereses")
    .eq("id", user.id)
    .maybeSingle();

  const interests = Array.isArray(unit?.intereses)
    ? unit.intereses.filter((item): item is number => typeof item === "number")
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo cliente y prestamo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea el cliente y su primer prestamo en un solo flujo.
          </p>
        </CardHeader>
        <CardContent>
          {interests.length > 0 ? (
            <NuevoClienteForm
              createClientLoan={createClientLoanAction}
              interests={interests}
            />
          ) : (
            <p className="text-sm text-destructive">
              Esta unidad no tiene intereses habilitados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
