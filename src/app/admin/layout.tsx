import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-semibold text-primary" href="/admin/dashboard">
            DinoPay Admin
          </Link>
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
            <Link className="rounded-md bg-muted px-3 py-2" href="/admin/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-md bg-muted px-3 py-2" href="/admin/gastos">
              Gastos
            </Link>
            <Link className="rounded-md bg-muted px-3 py-2" href="/admin/unidades/nueva">
              Nueva unidad
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
