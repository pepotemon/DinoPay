"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UnitMeta = {
  username: string;
  zona_horaria: string | null;
  pais_codigo: string | null;
  pais: string;
};

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
        .select("username, zona_horaria, pais_codigo, pais")
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
        <img
          alt={meta.pais_codigo}
          className="h-3.5 w-5 rounded-[2px] object-cover shadow-sm"
          src={`https://flagcdn.com/w40/${meta.pais_codigo.toLowerCase()}.png`}
        />
      ) : null}
      <span className="font-medium">{dateStr} · {timeStr}</span>
      <span className="text-border">·</span>
      <span className="font-bold text-foreground">@{meta.username}</span>
    </div>
  );
}
