import { describe, expect, it } from "vitest";
import { getFireflyService } from "./firefly";

describe("Firefly III Integration", () => {
  it("should connect to Firefly III and validate credentials", async () => {
    const firefly = getFireflyService();

    // Verificar que el servicio está habilitado
    expect(firefly.isEnabled()).toBe(true);

    // Intentar obtener datos del mes actual (esto valida que el token funciona)
    const currentMonthExpenses = await firefly.getCurrentMonthExpenses();

    // Debe retornar un número (puede ser 0 si no hay gastos)
    expect(typeof currentMonthExpenses).toBe("number");
    expect(currentMonthExpenses).toBeGreaterThanOrEqual(0);
  }, 15000); // Timeout de 15 segundos para la llamada a la API

  it("should calculate expenses correctly", async () => {
    const firefly = getFireflyService();

    if (!firefly.isEnabled()) {
      console.warn("Firefly III not configured, skipping test");
      return;
    }

    // Obtener gastos de diferentes períodos
    const [currentMonth, lastWeek, yesterday] = await Promise.all([
      firefly.getCurrentMonthExpenses(),
      firefly.getLastWeekExpenses(),
      firefly.getYesterdayExpenses(),
    ]);

    // Todos deben ser números válidos
    expect(typeof currentMonth).toBe("number");
    expect(typeof lastWeek).toBe("number");
    expect(typeof yesterday).toBe("number");

    // Los gastos no pueden ser negativos
    expect(currentMonth).toBeGreaterThanOrEqual(0);
    expect(lastWeek).toBeGreaterThanOrEqual(0);
    expect(yesterday).toBeGreaterThanOrEqual(0);
  }, 20000);
});
