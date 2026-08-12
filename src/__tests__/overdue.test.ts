import { describe, it, expect } from "vitest";
import { calcularDiasAtraso, calcularCuotasAdelantadas } from "@/lib/utils/overdue";

describe("calcularDiasAtraso", () => {
  const noHolidays = new Set<string>();

  it("retorna 0 si ultimaCuotaFecha es null", () => {
    expect(calcularDiasAtraso(null, noHolidays, "2026-06-15")).toBe(0);
  });

  it("retorna 0 si la cuota vence hoy o en el futuro", () => {
    expect(calcularDiasAtraso("2026-06-15", noHolidays, "2026-06-15")).toBe(0);
    expect(calcularDiasAtraso("2026-06-20", noHolidays, "2026-06-15")).toBe(0);
  });

  it("cuenta dias habiles de atraso (lun-sab, sin festivos)", () => {
    // 2026-06-10 es miercoles. Hoy es 2026-06-15 (lunes)
    // Atraso: 11(jue), 12(vie), 13(sab) = 3 dias (domingo no cuenta)
    expect(calcularDiasAtraso("2026-06-10", noHolidays, "2026-06-15")).toBe(3);
  });

  it("excluye domingos del conteo de atraso", () => {
    // 2026-06-07 (domingo), hoy 2026-06-08 (lunes)
    // Entre due+1 y today-1: solo 2026-06-08 no aplica (exclusivo)
    // Cursor desde 2026-06-08, antes de 2026-06-08 → no itera → 0 dias
    expect(calcularDiasAtraso("2026-06-07", noHolidays, "2026-06-08")).toBe(0);
  });

  it("excluye festivos del conteo", () => {
    const holidays = new Set(["2026-06-11"]);
    // Due: 2026-06-10, hoy: 2026-06-13 (sabado)
    // Cursor: 11(festivo→skip), 12(vie→+1) = 1 dia
    expect(calcularDiasAtraso("2026-06-10", holidays, "2026-06-13")).toBe(1);
  });
});

describe("calcularCuotasAdelantadas", () => {
  const diasLaborales = [1, 2, 3, 4, 5, 6]; // Lun-Sab

  it("retorna 0 si ultimaCuotaFecha es null", () => {
    expect(calcularCuotasAdelantadas(null, "diaria", diasLaborales, "2026-06-15", 1)).toBe(0);
  });

  it("retorna 0 si cuotasPagadas es 0", () => {
    expect(calcularCuotasAdelantadas("2026-06-20", "diaria", diasLaborales, "2026-06-15", 0)).toBe(0);
  });

  it("retorna 0 si la cuota vence hoy", () => {
    expect(calcularCuotasAdelantadas("2026-06-15", "diaria", diasLaborales, "2026-06-15", 1)).toBe(0);
  });

  it("cuenta dias laborales adelantados para modalidad diaria", () => {
    // Hoy: 2026-06-15 (lunes), due: 2026-06-17 (miercoles)
    // Dias adelantados (excl. hoy, incl. due): 16(mar), 17(mie) = 2
    expect(calcularCuotasAdelantadas("2026-06-17", "diaria", diasLaborales, "2026-06-15", 3)).toBe(2);
  });

  it("calcula cuotas adelantadas para modalidad semanal", () => {
    // Hoy: 2026-06-15, due: 2026-06-29 (14 dias adelante)
    // diffDays = 14, floor(14/7) - 1 = 2 - 1 = 1
    expect(calcularCuotasAdelantadas("2026-06-29", "semanal", diasLaborales, "2026-06-15", 2)).toBe(1);
  });

  it("calcula cuotas adelantadas para modalidad mensual", () => {
    // diffDays = 62, floor(62/30) - 1 = 2 - 1 = 1
    expect(calcularCuotasAdelantadas("2026-08-16", "mensual", diasLaborales, "2026-06-15", 1)).toBe(1);
  });

  it("retorna 0 si la diferencia no alcanza para 2 periodos", () => {
    // semanal, diffDays = 5, floor(5/7) - 1 = 0 - 1 → max(0, -1) = 0
    expect(calcularCuotasAdelantadas("2026-06-20", "semanal", diasLaborales, "2026-06-15", 2)).toBe(0);
  });
});

describe("calcularCuotasAdelantadas — modalidad quincenal", () => {
  const diasLaborales = [1, 2, 3, 4, 5, 6];

  it("cuenta cuotas adelantadas quincenales", () => {
    // diffDays = 31, floor(31/15) - 1 = 2 - 1 = 1
    expect(calcularCuotasAdelantadas("2026-07-16", "quincenal", diasLaborales, "2026-06-15", 2)).toBe(1);
  });
});
