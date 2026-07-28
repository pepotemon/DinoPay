"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UnitMeta = {
  encargado: string;
  zona_horaria: string | null;
  pais_codigo: string | null;
};

function countryFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65))
    .join("");
}

let cachedMeta: UnitMeta | null = null;

export function UnidadHeaderInfo() {
  const [meta, setMeta] = useState<UnitMeta | null>(cachedMeta);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (cachedMeta) return;
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      sb.from("units")
        .select("encargado, zona_horaria, pais_codigo")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            cachedMeta = data as UnitMeta;
            setMeta(cachedMeta);
          }
        });
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!meta) return null;

  const tz = meta.zona_horaria ?? "America/Bogota";
  const dateStr = now.toLocaleDateString("es-419", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = now.toLocaleTimeString("es-419", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {meta.pais_codigo ? (
        <span className="text-sm leading-none">{countryFlag(meta.pais_codigo)}</span>
      ) : null}
      <span className="font-medium">{dateStr} · {timeStr}</span>
      <span className="text-border">·</span>
      <span className="font-bold text-foreground">{meta.encargado}</span>
    </div>
  );
}
