import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export default function UnidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-semibold text-primary" href="/unidad/prestamos">
            DinoPay Unidad
          </Link>
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
            <Link className="rounded-md bg-muted px-3 py-2" href="/unidad/prestamos">
              Prestamos
            </Link>
            <Link className="rounded-md bg-muted px-3 py-2" href="/unidad/nuevo">
              Nuevo
            </Link>
            <Link className="rounded-md bg-muted px-3 py-2" href="/unidad/disponibles">
              Disponibles
            </Link>
            <Link className="rounded-md bg-muted px-3 py-2" href="/unidad/enrutar">
              Enrutar
            </Link>
            <Link className="rounded-md bg-muted px-3 py-2" href="/unidad/gastos">
              Gastos
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
