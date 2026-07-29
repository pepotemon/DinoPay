"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export const unidadPrefetchRoutes = [
  "/unidad/prestamos",
  "/unidad/nuevo",
  "/unidad/disponibles",
  "/unidad/menu",
  "/unidad/enrutar",
  "/unidad/gastos",
  "/unidad/reportes",
  "/unidad/reporte-diario",
  "/unidad/flujo-semanal"
];

export function usePrefetchUnidadRoutes() {
  const router = useRouter();

  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  const prefetchAll = useCallback(() => {
    unidadPrefetchRoutes.forEach(prefetchRoute);
  }, [prefetchRoute]);

  return { prefetchAll, prefetchRoute };
}

export function UnidadRoutePrefetcher() {
  const { prefetchAll } = usePrefetchUnidadRoutes();

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const handle = win.requestIdleCallback
      ? win.requestIdleCallback(prefetchAll, { timeout: 2_000 })
      : window.setTimeout(prefetchAll, 800);

    return () => {
      if (win.cancelIdleCallback && typeof handle === "number") {
        win.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    };
  }, [prefetchAll]);

  return null;
}
