"use client";

import { useState } from "react";
import Link from "next/link";
import { UnitClientsTab } from "@/components/admin/unit-clients-tab";
import { UnitConfigTab } from "@/components/admin/unit-config-tab";
import { UnitTransactionsTab } from "@/components/admin/unit-transactions-tab";
import { cn, formatCurrency } from "@/lib/utils";

type AdminClientWithLoan = {
  id: string;
  alias: string;
  nit: string | null;
  telefono1: string | null;
  activo: boolean;
  loan: {
    id: string;
    modalidad: string;
    interes: number;
    valor_neto: number;
    valor_cuota: number;
    saldo: number;
    numero_cuotas: number;
    cuotas_pagadas: number;
    ultima_cuota_fecha: string | null;
    estado: string;
  } | null;
};

type CapMov = {
  id: string;
  tipo: "ingreso" | "retiro";
  monto: number;
  nota: string | null;
  fecha: string;
};

type Expense = {
  id: string;
  categoria: string;
  monto: number;
  nota: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha: string;
  creado_por: string;
};

type UnitInfo = {
  id: string;
  username: string;
  nombre_unidad: string;
  encargado: string;
  telefono: string | null;
  pais: string;
  estado: string;
  ciudad: string;
  zona_horaria: string;
  capital_inicial: number;
  activo: boolean;
  intereses: number[];
  dias_laborales: number[];
  puede_eliminar_abonos: boolean;
  puede_eliminar_prestamos: boolean;
};

type HubData = {
  unit: UnitInfo;
  clients: AdminClientWithLoan[];
  capitalMovements: CapMov[];
  pendingExpenses: Expense[];
  recentExpenses: Expense[];
  cajaEstimada: number;
  carteraTotal: number;
  metaDia: number;
  cobradoHoy: number;
  today: string;
};

type Tab = "clientes" | "transacciones" | "configuracion";

export function UnitHubClient({ data }: { data: HubData }) {
  const [tab, setTab] = useState<Tab>("clientes");
  const { unit } = data;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-2">
        <Link
          className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
          href="/admin/unidades"
        >
          ← Unidades
        </Link>
      </div>

      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{unit.nombre_unidad}</h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  unit.activo
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {unit.activo ? "Activa" : "Inactiva"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              @{unit.username} · {unit.encargado} · {unit.ciudad}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Cartera</p>
            <p className="text-sm font-bold">{formatCurrency(data.carteraTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-sm font-bold">{formatCurrency(data.metaDia)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Caja</p>
            <p
              className={cn(
                "text-sm font-bold",
                data.cajaEstimada >= 0 ? "text-primary" : "text-destructive"
              )}
            >
              {formatCurrency(data.cajaEstimada)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1">
        <TabBtn active={tab === "clientes"} label="Clientes" onClick={() => setTab("clientes")} />
        <TabBtn
          active={tab === "transacciones"}
          label="Transacciones"
          onClick={() => setTab("transacciones")}
        />
        <TabBtn
          active={tab === "configuracion"}
          label="Configuración"
          onClick={() => setTab("configuracion")}
        />
      </div>

      {tab === "clientes" ? (
        <UnitClientsTab
          clients={data.clients}
          today={data.today}
          unitId={unit.id}
        />
      ) : tab === "transacciones" ? (
        <UnitTransactionsTab
          capitalMovements={data.capitalMovements}
          cajaEstimada={data.cajaEstimada}
          carteraTotal={data.carteraTotal}
          cobradoHoy={data.cobradoHoy}
          metaDia={data.metaDia}
          pendingExpenses={data.pendingExpenses}
          recentExpenses={data.recentExpenses}
          unitId={unit.id}
        />
      ) : (
        <UnitConfigTab unit={unit} />
      )}
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
