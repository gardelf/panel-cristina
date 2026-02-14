import axios from "axios";

interface GoogleSheetsConfig {
  spreadsheetId: string;
}

interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export class GoogleSheetsService {
  private spreadsheetId: string;
  private enabled: boolean;

  constructor(config?: GoogleSheetsConfig) {
    this.enabled = Boolean(config?.spreadsheetId);
    this.spreadsheetId = config?.spreadsheetId || "";
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Obtiene datos de una hoja de cálculo pública de Google Sheets
   * Usa la API pública que no requiere autenticación para hojas públicas
   */
  async getSheetData(range: string = "A1:Z1000"): Promise<string[][]> {
    if (!this.enabled) {
      return [];
    }

    try {
      // URL para acceder a Google Sheets como CSV público
      const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&range=${encodeURIComponent(range)}`;

      const response = await axios.get(url, {
        timeout: 10000,
      });

      // Parsear CSV manualmente
      const csvData = response.data;
      const rows = this.parseCSV(csvData);

      return rows;
    } catch (error) {
      console.error("[GoogleSheets] Error fetching data:", error);
      throw new Error("Error al obtener datos de Google Sheets");
    }
  }

  /**
   * Parser simple de CSV
   */
  private parseCSV(csvText: string): string[][] {
    const rows: string[][] = [];
    const lines = csvText.split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parser simple que maneja comillas
      const row: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }

      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  }

  /**
   * Extrae valores numéricos de celdas específicas
   */
  private extractNumber(value: string): number {
    if (!value) return 0;

    // Remover símbolos de moneda y espacios
    const cleaned = value.replace(/[€$,\s]/g, "").replace(",", ".");

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Calcula ingresos basándose en la estructura de la hoja
   * Esta función debe adaptarse a la estructura específica de la hoja de Cristina
   */
  async calculateIncome(): Promise<{
    currentIncome: number;
    pendingIncome: number;
    projectedIncome: number;
  }> {
    try {
      const data = await this.getSheetData();

      if (data.length === 0) {
        return {
          currentIncome: 0,
          pendingIncome: 0,
          projectedIncome: 0,
        };
      }

      // TODO: Adaptar esta lógica a la estructura real de la hoja de Cristina
      // Por ahora, retornamos valores de ejemplo
      // Necesitaremos saber:
      // - En qué columnas están los datos de ingresos
      // - Cómo identificar ingresos actuales vs pendientes vs proyectados
      // - Si hay alguna fórmula o cálculo específico

      let currentIncome = 0;
      let pendingIncome = 0;
      let projectedIncome = 0;

      // Ejemplo: sumar valores de columnas específicas
      // Esto debe ajustarse según la estructura real
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length >= 3) {
          currentIncome += this.extractNumber(row[0] || "0");
          pendingIncome += this.extractNumber(row[1] || "0");
          projectedIncome += this.extractNumber(row[2] || "0");
        }
      }

      return {
        currentIncome,
        pendingIncome,
        projectedIncome,
      };
    } catch (error) {
      console.error("[GoogleSheets] Error calculating income:", error);
      return {
        currentIncome: 0,
        pendingIncome: 0,
        projectedIncome: 0,
      };
    }
  }
}

// Singleton instance
let googleSheetsService: GoogleSheetsService | null = null;

export function getGoogleSheetsService(): GoogleSheetsService {
  if (!googleSheetsService) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (spreadsheetId) {
      googleSheetsService = new GoogleSheetsService({ spreadsheetId });
    } else {
      googleSheetsService = new GoogleSheetsService();
    }
  }

  return googleSheetsService;
}
