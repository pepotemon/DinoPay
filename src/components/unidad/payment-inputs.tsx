"use client";

import { ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PaymentInputs({
  maxCuotas,
  valorCuota,
  isPending = false
}: {
  maxCuotas: number;
  valorCuota: number;
  isPending?: boolean;
}) {
  const [cuotas, setCuotas] = useState(1);
  const [monto, setMonto] = useState(Number(valorCuota.toFixed(2)));

  useEffect(() => {
    setMonto(Number((cuotas * valorCuota).toFixed(2)));
  }, [cuotas, valorCuota]);

  function stepCuotas(next: number) {
    const bounded = Math.min(Math.max(next, 1), maxCuotas);
    setCuotas(bounded);
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-bold">Cuotas a pagar</span>
        <div className="grid h-10 grid-cols-[2.75rem_1fr_2.75rem] overflow-hidden rounded-xl bg-primary/10">
          <button
            className="grid place-items-center bg-destructive/10 text-destructive disabled:opacity-40"
            disabled={cuotas <= 1}
            onClick={() => stepCuotas(cuotas - 1)}
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <input
            className="h-10 w-full bg-transparent text-center text-base font-black outline-none"
            max={maxCuotas}
            min="1"
            name="numeroCuotas"
            onChange={(event) => stepCuotas(Number(event.target.value))}
            step="1"
            type="number"
            value={cuotas}
          />
          <button
            className="grid place-items-center bg-primary text-primary-foreground disabled:opacity-40"
            disabled={cuotas >= maxCuotas}
            onClick={() => stepCuotas(cuotas + 1)}
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold">
          Monto <span className="text-destructive">*</span>
        </span>
        <div className="flex h-10 items-center gap-2 rounded-xl bg-primary/10 px-3">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          <input
            className="h-10 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            min="0.01"
            name="monto"
            onChange={(event) => setMonto(Number(event.target.value))}
            step="0.01"
            type="number"
            value={monto}
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold">
          Metodo de pago <span className="text-destructive">*</span>
        </span>
        <div className="relative">
          <select
            className="h-10 w-full appearance-none rounded-xl bg-primary/10 px-3 pr-9 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="transferencia"
            name="metodoPago"
          >
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
      </label>

      <Button
        className="h-10 w-full rounded-xl text-sm font-black shadow-md shadow-primary/20"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Registrando..." : "Pagar"}
      </Button>
    </div>
  );
}
