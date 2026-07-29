"use client";

import { Banknote, LayoutGrid, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrefetchUnidadRoutes } from "@/components/unidad/route-prefetcher";

const nav = [
  { href: "/unidad/prestamos", label: "Préstamos", icon: Banknote },
  { href: "/unidad/nuevo", label: "Nuevo", icon: Plus },
  { href: "/unidad/disponibles", label: "Disponibles", icon: Users },
  { href: "/unidad/menu", label: "Menú", icon: LayoutGrid }
];

export function BottomNav() {
  const pathname = usePathname();
  const { prefetchAll, prefetchRoute } = usePrefetchUnidadRoutes();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background">
      <div className="mx-auto flex max-w-5xl">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/unidad/menu" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onPointerEnter={() => prefetchRoute(href)}
              onTouchStart={prefetchAll}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
