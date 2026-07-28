import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { GastosClient, type GastoRow } from "@/components/unidad/gastos-client";

export default function GastosPage() {
  return (
    <div className="pb-6">
      <Suspense fallback={<GastosSkeleton />}>
        <GastosContent />
      </Suspense>
    </div>
  );
}

async function GastosContent() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().slice(0, 10);

  const adminClient = createAdminClient();
  const { data: expenses } = await adminClient
    .from("expenses")
    .select("id, categoria, monto, nota, estado, fecha")
    .eq("unit_id", user.id)
    .gte("fecha", sinceStr)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (expenses ?? []) as GastoRow[];

  return <GastosClient expenses={rows} />;
}

function GastosSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Hero */}
      <div className="flex items-end justify-between px-1 pb-4 pt-2">
        <div className="space-y-2">
          <div className="h-10 w-36 rounded-xl bg-muted" />
          <div className="h-6 w-28 rounded-lg bg-muted" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-muted" />
      </div>

      {/* Button */}
      <div className="h-14 rounded-2xl bg-muted" />

      {/* Date pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
      </div>

      {/* Notice */}
      <div className="h-16 rounded-2xl bg-muted" />

      {/* Cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-5 w-20 rounded bg-muted" />
                <div className="h-4 w-16 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
