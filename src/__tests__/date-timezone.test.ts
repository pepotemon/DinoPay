import { describe, it, expect } from "vitest";
import { addDaysToDateString, dateInTimeZone } from "@/lib/utils/date-timezone";

describe("addDaysToDateString", () => {
  it("avanza un dia", () => {
    expect(addDaysToDateString("2026-01-01", 1)).toBe("2026-01-02");
  });

  it("retrocede un dia", () => {
    expect(addDaysToDateString("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("maneja cruces de mes", () => {
    expect(addDaysToDateString("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("maneja cruces de anio", () => {
    expect(addDaysToDateString("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("suma cero dias", () => {
    expect(addDaysToDateString("2026-06-15", 0)).toBe("2026-06-15");
  });

  it("suma 30 dias correctamente", () => {
    expect(addDaysToDateString("2026-01-01", 30)).toBe("2026-01-31");
  });

  it("maneja anios bisiestos", () => {
    expect(addDaysToDateString("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDaysToDateString("2025-02-28", 1)).toBe("2025-03-01");
  });
});

describe("dateInTimeZone", () => {
  it("convierte UTC a Bogota (UTC-5)", () => {
    // 2026-06-15T04:00:00Z == 2026-06-14T23:00:00-05:00
    const result = dateInTimeZone("2026-06-15T04:00:00Z", "America/Bogota");
    expect(result).toBe("2026-06-14");
  });

  it("convierte UTC a Bogota cuando ya es el mismo dia", () => {
    // 2026-06-15T12:00:00Z == 2026-06-15T07:00:00-05:00
    const result = dateInTimeZone("2026-06-15T12:00:00Z", "America/Bogota");
    expect(result).toBe("2026-06-15");
  });

  it("maneja zona horaria Argentina (UTC-3)", () => {
    // 2026-06-15T02:00:00Z == 2026-06-14T23:00:00-03:00
    const result = dateInTimeZone("2026-06-15T02:00:00Z", "America/Argentina/Buenos_Aires");
    expect(result).toBe("2026-06-14");
  });
});
