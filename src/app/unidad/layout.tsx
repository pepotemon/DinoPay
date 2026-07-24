import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";

export default function UnidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link className="font-semibold text-primary" href="/unidad/prestamos">
            DinoPay Unidad
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/unidad/prestamos">Prestamos</Link>
            <Link href="/unidad/nuevo">Nuevo</Link>
            <Link href="/unidad/disponibles">Disponibles</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
