import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditExpenseForm } from "@/components/unidad/edit-expense-form";
import { Button } from "@/components/ui/button";
import { updateExpenseAction } from "@/lib/actions/unidad/gastos";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function EditarGastoPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: expense } = await adminClient
    .from("expenses")
    .select("id, categoria, monto, nota, estado")
    .eq("id", id)
    .eq("unit_id", user.id)
    .eq("estado", "pendiente")
    .maybeSingle();

  if (!expense) notFound();

  const row = expense as {
    id: string;
    categoria: string;
    monto: number;
    nota: string | null;
    estado: string;
  };

  return (
    <div className="space-y-5 pb-8">
      <Button asChild size="sm" variant="secondary">
        <Link href="/unidad/gastos">
          <ArrowLeft className="h-4 w-4" />
          Gastos
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Editar gasto</h1>
        <p className="text-sm text-muted-foreground">{row.categoria}</p>
      </div>

      <EditExpenseForm
        defaults={{
          expenseId: row.id,
          categoria: row.categoria,
          monto: Number(row.monto),
          nota: row.nota
        }}
        updateExpense={updateExpenseAction}
      />
    </div>
  );
}
