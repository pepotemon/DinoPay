"use client";

import { useTransition } from "react";
import { cancelLoanAction } from "@/lib/actions/admin/prestamos";
import { formatCurrency } from "@/lib/utils";

export function CancelLoanButton({
  loanId,
  unitId,
  clientAlias,
  valorNeto
}: {
  loanId: string;
  unitId: string;
  clientAlias: string;
  valorNeto: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`¿Cancelar el préstamo de ${clientAlias} por ${formatCurrency(valorNeto)}? Esta acción no se puede deshacer.`)) {
      return;
    }
    const formData = new FormData();
    formData.set("loanId", loanId);
    formData.set("unitId", unitId);
    startTransition(() => cancelLoanAction(formData));
  }

  return (
    <button
      className="w-full rounded-md border border-destructive/40 bg-destructive/10 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
      disabled={pending}
      onClick={handleClick}
      type="button"
    >
      {pending ? "Cancelando…" : "Cancelar préstamo"}
    </button>
  );
}
