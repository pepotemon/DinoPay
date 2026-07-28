export function calcularDiasAtraso(
  ultimaCuotaFecha: string | null,
  holidaySet: Set<string>
): number {
  if (!ultimaCuotaFecha) return 0;

  const due = new Date(ultimaCuotaFecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due >= today) return 0;

  let days = 0;
  const cursor = new Date(due);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor < today) {
    const isSunday = cursor.getDay() === 0;
    const dateStr = cursor.toISOString().slice(0, 10);
    const isHoliday = holidaySet.has(dateStr);

    if (!isSunday && !isHoliday) days++;

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function calcularCuotasAdelantadas(
  ultimaCuotaFecha: string | null,
  modalidad: string,
  diasLaborales: number[]
): number {
  if (!ultimaCuotaFecha) return 0;

  const due = new Date(ultimaCuotaFecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due <= today) return 0;

  if (modalidad === "diaria") {
    // Cuotas adelantadas = días laborales estrictamente entre hoy y due (exclusive)
    let count = 0;
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor < due) {
      if (diasLaborales.includes(cursor.getDay())) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (modalidad === "semanal") return Math.max(0, Math.floor(diffDays / 7) - 1);
  if (modalidad === "quincenal") return Math.max(0, Math.floor(diffDays / 15) - 1);
  return Math.max(0, Math.floor(diffDays / 30) - 1); // mensual
}
