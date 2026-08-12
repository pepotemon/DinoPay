"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Plus,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    href: "/admin/unidades",
    icon: Building2,
    label: "Unidades",
    // active for /admin/unidades/* except /nueva
    matchFn: (p: string) =>
      p.startsWith("/admin/unidades") && !p.startsWith("/admin/unidades/nueva")
  },
  { href: "/admin/gastos", icon: Receipt, label: "Gastos" }
];

function useLogout() {
  const router = useRouter();
  return async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };
}

function SidebarContent({
  pathname,
  onNav
}: {
  pathname: string;
  onNav?: () => void;
}) {
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b px-5 py-5">
        <Link
          href="/admin/dashboard"
          onClick={onNav}
          className="flex items-center gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base text-white">
            🦕
          </span>
          <div>
            <p className="text-sm font-bold leading-none">DinoPay</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              Panel Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Navegación
        </p>
        <ul className="space-y-0.5">
          {navLinks.map(({ href, icon: Icon, label, matchFn }) => {
            const active = matchFn
              ? matchFn(pathname)
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNav}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t pt-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Acciones
          </p>
          <Link
            href="/admin/unidades/nueva"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/admin/unidades/nueva"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nueva unidad
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t px-3 py-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          type="button"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/** Desktop sidebar — hidden on mobile, always visible on lg+ */
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex lg:flex-col w-56 shrink-0 sticky top-0 h-screen border-r bg-background z-20">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

/** Mobile top bar + slide-out drawer — only visible below lg */
export function AdminTopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-3">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm text-white">
            🦕
          </span>
          <span className="font-bold text-sm">DinoPay Admin</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          type="button"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex w-72 flex-col bg-background shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted z-10"
              type="button"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
