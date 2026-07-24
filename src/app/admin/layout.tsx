import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link className="font-semibold text-primary" href="/admin/dashboard">
            DinoPay Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/dashboard">Dashboard</Link>
            <Link href="/admin/unidades/nueva">Nueva unidad</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
