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
    <div className="space-y-5">
      <label className="block space-y-3">
        <span className="text-base font-medium">Cuotas a pagar</span>
        <div className="grid h-14 grid-cols-[4rem_1fr_4rem] overflow-hidden rounded-xl bg-primary/10">
          <button
            className="grid place-items-center bg-destructive/10 text-destructive disabled:opacity-40"
            disabled={cuotas <= 1}
            onClick={() => stepCuotas(cuotas - 1)}
            type="button"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <input
            className="h-14 w-full bg-transparent text-center text-lg font-black outline-none"
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
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      </label>

      <label className="block space-y-3">
        <span className="text-base font-medium">
          Monto <span className="text-destructive">*</span>
        </span>
        <div className="flex h-14 items-center gap-3 rounded-xl bg-primary/10 px-4">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          <input
            className="h-14 min-w-0 flex-1 bg-transparent text-base font-bold outline-none"
            min="0.01"
            name="monto"
            onChange={(event) => setMonto(Number(event.target.value))}
            step="0.01"
            type="number"
            value={monto}
          />
        </div>
      </label>

      <label className="block space-y-3">
        <span className="text-base font-medium">
          Metodo de pago <span className="text-destructive">*</span>
        </span>
        <div className="relative">
          <select
            className="h-14 w-full appearance-none rounded-xl bg-primary/10 px-4 pr-11 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="transferencia"
            name="metodoPago"
          >
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-4 h-6 w-6 text-muted-foreground" />
        </div>
      </label>

      <Button
        className="h-14 w-full rounded-2xl text-base font-black shadow-lg shadow-primary/20"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Registrando..." : "Pagar"}
      </Button>
    </div>
  );
}
