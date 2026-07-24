"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  CalendarDays,
  FileText,
  LogOut,
  MapPin,
  MoreHorizontal,
  Plus,
  Receipt,
  Users,
  Wallet,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const mainNav = [
  { href: "/unidad/prestamos", label: "Préstamos", icon: Banknote },
  { href: "/unidad/nuevo", label: "Nuevo", icon: Plus },
  { href: "/unidad/disponibles", label: "Disponibles", icon: Users }
];

const menuNav = [
  { href: "/unidad/enrutar", label: "Enrutar clientes", icon: MapPin },
  { href: "/unidad/gastos", label: "Gastos", icon: Receipt },
  { href: "/unidad/reportes", label: "Reportes", icon: FileText },
  { href: "/unidad/reporte-diario", label: "Caja", icon: Wallet },
  { href: "/unidad/flujo-semanal", label: "Flujo semanal", icon: CalendarDays }
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isMenuActive = menuNav.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-2xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <span className="font-semibold">Menú</span>
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-0.5 px-3 pb-2">
              {menuNav.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="mx-3 mb-6 mt-1 border-t pt-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background">
        <div className="mx-auto flex max-w-5xl">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              open || isMenuActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            Menú
          </button>
        </div>
      </nav>
    </>
  );
}
