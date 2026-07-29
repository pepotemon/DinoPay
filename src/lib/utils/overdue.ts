import { addDaysToDateString } from "@/lib/utils/date-timezone";

function dayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function diffCalendarDays(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const fromDate = Date.UTC(fromYear, fromMonth - 1, fromDay, 12);
  const toDate = Date.UTC(toYear, toMonth - 1, toDay, 12);
  return Math.round((toDate - fromDate) / 86400000);
}

export function calcularDiasAtraso(
  ultimaCuotaFecha: string | null,
  holidaySet: Set<string>,
  today: string
): number {
  if (!ultimaCuotaFecha) return 0;

  const due = ultimaCuotaFecha.slice(0, 10);
  if (due >= today) return 0;

  let days = 0;
  let cursor = addDaysToDateString(due, 1);

  while (cursor < today) {
    const isSunday = dayOfWeek(cursor) === 0;
    const isHoliday = holidaySet.has(cursor);

    if (!isSunday && !isHoliday) days++;

    cursor = addDaysToDateString(cursor, 1);
  }

  return days;
}

export function calcularCuotasAdelantadas(
  ultimaCuotaFecha: string | null,
  modalidad: string,
  diasLaborales: number[],
  today: string
): number {
  if (!ultimaCuotaFecha) return 0;

  const due = ultimaCuotaFecha.slice(0, 10);
  if (due <= today) return 0;

  if (modalidad === "diaria") {
    // Cuotas adelantadas = dias laborales estrictamente entre hoy y due (exclusive).
    let count = 0;
    let cursor = addDaysToDateString(today, 1);
    while (cursor < due) {
      if (diasLaborales.includes(dayOfWeek(cursor))) count++;
      cursor = addDaysToDateString(cursor, 1);
    }
    return count;
  }

  const diffDays = diffCalendarDays(today, due);

  if (modalidad === "semanal") return Math.max(0, Math.floor(diffDays / 7) - 1);
  if (modalidad === "quincenal") return Math.max(0, Math.floor(diffDays / 15) - 1);
  return Math.max(0, Math.floor(diffDays / 30) - 1); // mensual
}
