"use client";

import { ChevronRight, MapPin, Phone, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export type AvailableClient = {
  id: string;
  alias: string;
  nit: string | null;
  direccion1: string | null;
  barrio: string | null;
  telefono1: string | null;
  lastLoan: {
    valor_neto: number;
    created_at: string;
  } | null;
  loanCount: number;
};

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return "hoy";
  if (days === 1) return "hace 1 día";
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? "es" : ""}`;
  const years = Math.floor(days / 365);
  return `hace ${years} año${years > 1 ? "s" : ""}`;
}

export function DisponiblesClient({ clients }: { clients: AvailableClient[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.alias.toLowerCase().includes(q) ||
        (c.telefono1 ?? "").includes(q) ||
        (c.nit ?? "").includes(q) ||
        (c.direccion1 ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="sticky top-0 z-10 space-y-3 bg-background pb-2 pt-1">
        <p className="text-sm font-bold text-muted-foreground">
          {filtered.length === clients.length
            ? `${clients.length} clientes disponibles`
            : `${filtered.length} de ${clients.length} clientes`}
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" />
          <input
            className="h-12 w-full rounded-xl bg-green-50 pl-10 pr-4 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
            placeholder="Buscar por nombre, teléfono o cédula…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border px-4 py-8 text-center text-sm text-muted-foreground">
          {search
            ? "Sin resultados para esa búsqueda."
            : "No hay clientes disponibles. Cuando un préstamo se complete, aparecerá aquí."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: AvailableClient }) {
  const initials = client.alias
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const address = [client.direccion1, client.barrio].filter(Boolean).join(", ");

  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
          {initials || "?"}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black leading-tight">{client.alias}</p>
            {client.loanCount > 0 ? (
              <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-black text-green-700">
                {client.loanCount}× préstamo
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black text-muted-foreground">
                Nuevo
              </span>
            )}
          </div>

          {client.telefono1 ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              {client.telefono1}
            </p>
          ) : null}

          {address ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{address}</span>
            </p>
          ) : null}

          {client.lastLoan ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Último préstamo{" "}
              <span className="font-black text-foreground">
                {formatCurrency(Number(client.lastLoan.valor_neto))}
              </span>
              {"  ·  "}
              <span className="font-semibold text-primary">
                {timeAgo(client.lastLoan.created_at)}
              </span>
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Sin historial previo</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <Link
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-white shadow-sm shadow-primary/25 transition-opacity active:opacity-80"
        href={`/unidad/disponibles/${client.id}/nuevo`}
      >
        Nuevo préstamo
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
