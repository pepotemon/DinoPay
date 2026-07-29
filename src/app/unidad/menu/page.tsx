import {
  CalendarDays,
  ChevronRight,
  FileText,
  LogOut,
  MapPin,
  Receipt,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/unidad/logout-button";
import { getUnitMeta } from "@/lib/data/unit";

const menuItems = [
  {
    href: "/unidad/enrutar",
    label: "Enrutar clientes",
    description: "Ordena el orden de visita de hoy",
    icon: MapPin
  },
  {
    href: "/unidad/gastos",
    label: "Gastos",
    description: "Registra y consulta tus gastos",
    icon: Receipt
  },
  {
    href: "/unidad/reportes",
    label: "Reportes",
    description: "Historial de pagos por fecha",
    icon: FileText
  },
  {
    href: "/unidad/reporte-diario",
    label: "Caja del día",
    description: "Resumen y estimado de caja",
    icon: Wallet
  },
  {
    href: "/unidad/flujo-semanal",
    label: "Flujo semanal",
    description: "Tu cuaderno semanal personal",
    icon: CalendarDays
  }
];

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const unit = await getUnitMeta(user.id);

  return (
    <div className="space-y-5 pb-4">
      {/* ── Tarjeta de usuario ── */}
      <div className="rounded-2xl bg-primary/10 px-5 py-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">DinoPay</p>
        <p className="mt-1.5 text-2xl font-black leading-tight">
          {unit?.encargado ?? "—"}
        </p>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          {unit?.nombre_unidad ?? ""}
        </p>
      </div>

      {/* ── Navegación ── */}
      <div className="overflow-hidden rounded-2xl border divide-y">
        {menuItems.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 active:bg-muted/60"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
          </Link>
        ))}
      </div>

      {/* ── Cerrar sesión ── */}
      <div className="overflow-hidden rounded-2xl border">
        <LogoutButton />
      </div>
    </div>
  );
}
