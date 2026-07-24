import Link from "next/link";
import { BottomNav } from "@/components/unidad/bottom-nav";

export default function UnidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <Link className="font-semibold text-primary" href="/unidad/prestamos">
            DinoPay
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
