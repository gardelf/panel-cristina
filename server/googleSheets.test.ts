import { describe, expect, it } from "vitest";
import { getGoogleSheetsService } from "./googleSheets";

describe("Google Sheets Integration", () => {
  it("should connect to Google Sheets and fetch data", async () => {
    const sheets = getGoogleSheetsService();

    // Verificar que el servicio está habilitado
    expect(sheets.isEnabled()).toBe(true);

    // Intentar obtener datos de la hoja
    const data = await sheets.getSheetData("A1:Z100");

    // Debe retornar un array (puede estar vacío si la hoja está vacía)
    expect(Array.isArray(data)).toBe(true);

    // Si hay datos, verificar que tienen la estructura correcta
    if (data.length > 0) {
      expect(Array.isArray(data[0])).toBe(true);
    }
  }, 15000); // Timeout de 15 segundos

  it("should calculate income from sheet data", async () => {
    const sheets = getGoogleSheetsService();

    if (!sheets.isEnabled()) {
      console.warn("Google Sheets not configured, skipping test");
      return;
    }

    // Calcular ingresos
    const income = await sheets.calculateIncome();

    // Verificar estructura del resultado
    expect(typeof income.currentIncome).toBe("number");
    expect(typeof income.pendingIncome).toBe("number");
    expect(typeof income.projectedIncome).toBe("number");

    // Los valores deben ser no negativos
    expect(income.currentIncome).toBeGreaterThanOrEqual(0);
    expect(income.pendingIncome).toBeGreaterThanOrEqual(0);
    expect(income.projectedIncome).toBeGreaterThanOrEqual(0);
  }, 15000);
});
