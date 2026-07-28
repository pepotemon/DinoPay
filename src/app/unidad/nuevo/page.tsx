import { Suspense } from "react";
import { redirect } from "next/navigation";
import { NuevoClienteForm } from "@/components/unidad/nuevo-cliente-form";
import { createClient } from "@/lib/supabase/server";
import { createClientLoanAction } from "@/lib/actions/unidad/nuevo";
import { getUnitMeta } from "@/lib/data/unit";

// Shell síncrono — hero visible al instante
export default function NuevoPrestamoPage() {
  return (
    <div className="pb-6">
      {/* Hero — renderiza inmediatamente sin datos */}
      <div className="flex items-end justify-between px-1 pb-6 pt-2">
        <div>
          <h1 className="text-4xl font-black">Nuevo</h1>
          <p className="text-lg font-bold text-primary">Cliente</p>
        </div>
        <span className="select-none text-5xl">💸</span>
      </div>

      <Suspense fallback={<FormSkeleton />}>
        <FormWithData />
      </Suspense>
    </div>
  );
}

// Componente async — datos streaman sin bloquear el hero
async function FormWithData() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const unit = await getUnitMeta(user.id);

  const interests = Array.isArray(unit?.intereses)
    ? (unit.intereses as unknown[]).filter((item): item is number => typeof item === "number")
    : [];

  if (interests.length === 0) {
    return (
      <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
        Esta unidad no tiene tasas de interés habilitadas.
      </p>
    );
  }

  return <NuevoClienteForm createClientLoan={createClientLoanAction} interests={interests} />;
}

function FormSkeleton() {
  return (
    <div className="max-w-lg mx-auto space-y-4 animate-pulse">
      {[5, 3, 4].map((fields, si) => (
        <div key={si} className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          {Array.from({ length: fields > 3 ? 3 : fields }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-12 rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      ))}
      <div className="h-14 rounded-2xl bg-muted" />
    </div>
  );
}
