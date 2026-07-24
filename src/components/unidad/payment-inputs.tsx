"use client";

import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function PaymentInputs({
  maxCuotas,
  valorCuota
}: {
  maxCuotas: number;
  valorCuota: number;
}) {
  const [cuotas, setCuotas] = useState(1);
  const [monto, setMonto] = useState(Number(valorCuota.toFixed(2)));

  useEffect(() => {
    setMonto(Number((cuotas * valorCuota).toFixed(2)));
  }, [cuotas, valorCuota]);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Cuotas</span>
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            max={maxCuotas}
            min="1"
            name="numeroCuotas"
            onChange={(event) => setCuotas(Number(event.target.value))}
            step="1"
            type="number"
            value={cuotas}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Monto</span>
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            min="0.01"
            name="monto"
            onChange={(event) => setMonto(Number(event.target.value))}
            step="0.01"
            type="number"
            value={monto}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Metodo</span>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            name="metodoPago"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Cuota base: {formatCurrency(valorCuota)}
        </p>
        <Button size="sm" type="submit">
          <Banknote className="h-4 w-4" />
          Registrar pago
        </Button>
      </div>
    </>
  );
}
