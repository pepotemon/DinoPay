"use client";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  History,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  UserPen,
  X
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatCurrency } from "@/lib/utils";

export type CompletedLoan = {
  id: string;
  valor_neto: number;
  total_a_cobrar: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  valor_cuota: number;
  interes: number;
  modalidad: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
};

export type AvailableClient = {
  id: string;
  alias: string;
  nit: string | null;
  direccion1: string | null;
  direccion2: string | null;
  barrio: string | null;
  telefono1: string | null;
  telefono2: string | null;
  genero: string | null;
  lastLoan: { valor_neto: number; created_at: string } | null;
  loanCount: number;
  loanHistory: CompletedLoan[];
};

type SheetState =
  | null
  | { view: "main"; client: AvailableClient }
  | { view: "info-details"; client: AvailableClient }
  | { view: "info-loans"; client: AvailableClient };

function digitsOnly(v: string | null | undefined) {
  return v?.replace(/\D/g, "") ?? "";
}

function whatsappHref(phone: string, alias: string) {
  const msg = encodeURIComponent(`Hola ${alias}, te escribo de DinoPay.`);
  return `https://wa.me/${digitsOnly(phone)}?text=${msg}`;
}

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

function formatDateNice(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-419", { month: "short", day: "numeric", year: "numeric" });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function backView(sheet: Exclude<SheetState, null>): SheetState {
  if (sheet.view === "info-details" || sheet.view === "info-loans") {
    return { view: "main", client: sheet.client };
  }
  return null;
}

function sheetSubtitle(view: Exclude<SheetState, null>["view"]): string | null {
  if (view === "info-details") return "Información del cliente";
  if (view === "info-loans") return "Historial de préstamos";
  return null;
}

export function DisponiblesClient({ clients }: { clients: AvailableClient[] }) {
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<SheetState>(null);
  // Keep last non-null sheet for render during close animation
  const frozenSheet = useRef<Exclude<SheetState, null> | null>(null);
  if (sheet) frozenSheet.current = sheet;

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
    <>
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

        {/* List */}
        {filtered.length === 0 ? (
          <p className="rounded-2xl border px-4 py-8 text-center text-sm text-muted-foreground">
            {search
              ? "Sin resultados para esa búsqueda."
              : "No hay clientes disponibles. Cuando un préstamo se complete, aparecerá aquí."}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onOpen={() => setSheet({ view: "main", client })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom sheet ── */}
      <BottomSheet open={!!sheet} onClose={() => setSheet(null)}>
        {frozenSheet.current ? (
          <>
            {/* Header */}
            <div className="relative flex shrink-0 items-center border-b border-border/50 px-5 pb-3 pt-1">
              {frozenSheet.current.view !== "main" ? (
                <button
                  className="absolute left-4 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => setSheet(backView(frozenSheet.current!))}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              <div className="min-w-0 flex-1 px-10">
                <p className="truncate text-xl font-black">{frozenSheet.current.client.alias}</p>
                {sheetSubtitle(frozenSheet.current.view) ? (
                  <p className="text-xs font-bold text-muted-foreground">
                    {sheetSubtitle(frozenSheet.current.view)}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="Cerrar"
                className="absolute right-4 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                onClick={() => setSheet(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
            >
              <div className="py-3">
                {frozenSheet.current.view === "main" ? (
                  <SheetMain client={frozenSheet.current.client} onSetSheet={setSheet} />
                ) : frozenSheet.current.view === "info-details" ? (
                  <SheetInfoDetails client={frozenSheet.current.client} />
                ) : frozenSheet.current.view === "info-loans" ? (
                  <SheetInfoLoans client={frozenSheet.current.client} />
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </BottomSheet>
    </>
  );
}

function ClientCard({
  client,
  onOpen
}: {
  client: AvailableClient;
  onOpen: () => void;
}) {
  const initials = client.alias
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const address = [client.direccion1, client.barrio].filter(Boolean).join(", ");

  return (
    <button
      className="w-full rounded-2xl border bg-background p-4 shadow-sm text-left transition-colors active:bg-muted/30"
      onClick={onOpen}
      type="button"
    >
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

        <ChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/40" />
      </div>
    </button>
  );
}

function SheetMain({
  client,
  onSetSheet
}: {
  client: AvailableClient;
  onSetSheet: (s: SheetState) => void;
}) {
  const phone = client.telefono1 || client.telefono2 || "";
  const hasPhone = digitsOnly(phone).length > 0;
  const address = [client.direccion1, client.barrio].filter(Boolean).join(", ");

  return (
    <div className="space-y-4 px-5">
      {address ? <p className="text-sm text-muted-foreground">{address}</p> : null}

      {/* Phone / WhatsApp */}
      {hasPhone ? (
        <div className="grid grid-cols-2 gap-3">
          <a
            className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
            href={`tel:${digitsOnly(phone)}`}
          >
            <Phone className="h-4 w-4" />
            Llamar
          </a>
          <a
            className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
            href={whatsappHref(phone, client.alias)}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
            WhatsApp
          </a>
        </div>
      ) : null}

      {/* Nuevo préstamo CTA */}
      <Link
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-white shadow-lg shadow-primary/25"
        href={`/unidad/disponibles/${client.id}/nuevo`}
      >
        Nuevo préstamo
        <ChevronRight className="h-4 w-4" />
      </Link>

      {/* Actions */}
      <div className="space-y-0.5 border-t pt-2">
        <SheetAction
          icon={<FileText className="h-5 w-5" />}
          label="Ver detalles"
          onClick={() => onSetSheet({ view: "info-details", client })}
        />
        <SheetAction
          icon={<History className="h-5 w-5" />}
          label="Historial de préstamos"
          onClick={() => onSetSheet({ view: "info-loans", client })}
        />
        <SheetAction
          href={`/unidad/disponibles/${client.id}/editar`}
          icon={<UserPen className="h-5 w-5" />}
          label="Editar cliente"
        />
      </div>
    </div>
  );
}

function SheetInfoDetails({ client }: { client: AvailableClient }) {
  const generoLabel: Record<string, string> = {
    masculino: "Masculino",
    femenino: "Femenino",
    otro: "Otro"
  };

  const rows = [
    { label: "Cédula / NIT", value: client.nit },
    { label: "Teléfono 1", value: client.telefono1 },
    { label: "Teléfono 2", value: client.telefono2 },
    { label: "Dirección 1", value: client.direccion1 },
    { label: "Dirección 2", value: client.direccion2 },
    { label: "Barrio", value: client.barrio },
    { label: "Género", value: client.genero ? (generoLabel[client.genero] ?? client.genero) : null }
  ].filter((r) => r.value);

  return (
    <div className="space-y-3 px-5">
      {/* Avatar card */}
      <div className="flex items-center gap-4 rounded-2xl bg-primary/10 px-5 py-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/20 text-lg font-black text-primary">
          {client.alias
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("") || "?"}
        </div>
        <div>
          <p className="font-black leading-tight">{client.alias}</p>
          {client.loanCount > 0 ? (
            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-black text-green-700">
              {client.loanCount}× préstamo
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black text-muted-foreground">
              Sin historial
            </span>
          )}
        </div>
      </div>

      {/* Info rows */}
      {rows.length > 0 ? (
        <div className="divide-y rounded-2xl border">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
              <span className="text-xs font-bold text-muted-foreground">{label}</span>
              <span className="text-right text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border px-4 py-4 text-sm text-muted-foreground">
          Sin información adicional registrada.
        </p>
      )}
    </div>
  );
}

function SheetInfoLoans({ client }: { client: AvailableClient }) {
  if (client.loanHistory.length === 0) {
    return (
      <div className="px-5">
        <p className="rounded-2xl border px-4 py-8 text-center text-sm text-muted-foreground">
          Este cliente no tiene préstamos completados aún.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5">
      {client.loanHistory.map((loan, idx) => (
        <div key={loan.id} className="space-y-3">
          {idx > 0 ? <div className="border-t" /> : null}

          <div className="flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3">
            <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-snug">
              <span className="font-black">{formatDateNice(loan.fecha_inicio)}</span>
              {" → "}
              <span className="font-black">{formatDateNice(loan.fecha_fin)}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total" value={formatCurrency(Number(loan.total_a_cobrar))} />
            <StatBox label="Neto" value={formatCurrency(Number(loan.valor_neto))} />
            <StatBox label="Interés" value={`${loan.interes}%`} />
            <StatBox label="Cuota" value={formatCurrency(Number(loan.valor_cuota))} />
          </div>

          <div className="rounded-2xl border p-4">
            <p className="mb-2.5 font-black">Resumen</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                Modalidad: {capitalize(loan.modalidad)}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                Cuotas: {loan.cuotas_pagadas} / {loan.numero_cuotas}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                Estado: {capitalize(loan.estado)}
              </li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black text-primary">{value}</p>
    </div>
  );
}

function SheetAction({
  icon,
  label,
  onClick,
  href
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-bold transition-colors hover:bg-muted active:bg-muted/70";

  if (href) {
    return (
      <Link className={cls} href={href}>
        <span className="text-primary">{icon}</span>
        {label}
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40" />
      </Link>
    );
  }

  return (
    <button className={cls} onClick={onClick} type="button">
      <span className="text-primary">{icon}</span>
      {label}
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40" />
    </button>
  );
}
