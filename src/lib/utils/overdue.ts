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
