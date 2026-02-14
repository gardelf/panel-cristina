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
  async getSheetData(range: string = "A1:Z1000", sheet?: string): Promise<string[][]> {
    if (!this.enabled) {
      return [];
    }

    try {
      // URL para acceder a Google Sheets como CSV público
      let url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&range=${encodeURIComponent(range)}`;
      
      // Agregar nombre de pestaña si se especifica
      if (sheet) {
        url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&range=${encodeURIComponent(range)}`;
      }

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
   * Calcula ingresos basándose en las pestañas "pagos" y "clientes"
   * - currentIncome: suma de columna E en "pagos" (pagos ya recibidos)
   * - projectedIncome: suma de columna W en "clientes" (total esperado)
   * - pendingIncome: projectedIncome - currentIncome (pendiente de cobro)
   */
  async calculateIncome(): Promise<{
    currentIncome: number;
    pendingIncome: number;
    projectedIncome: number;
  }> {
    try {
      // Obtener datos de pagos (columna E)
      const pagosData = await this.getSheetData("A1:F10000", "pagos");
      
      // Obtener datos de clientes (columna W - importe)
      const clientesData = await this.getSheetData("A1:W10000", "clientes");

      let currentIncome = 0;
      let projectedIncome = 0;

      // Sumar todos los pagos ya recibidos (columna E en "pagos")
      // La columna E es el índice 4 (0-indexed: A=0, B=1, C=2, D=3, E=4)
      for (let i = 1; i < pagosData.length; i++) {
        const row = pagosData[i];
        if (row.length >= 5) {
          const importe = this.extractNumber(row[4] || "0");
          currentIncome += importe;
        }
      }

      // Sumar todos los importes esperados (columna W en "clientes")
      // La columna W es el índice 22 (0-indexed: A=0...W=22)
      for (let i = 1; i < clientesData.length; i++) {
        const row = clientesData[i];
        if (row.length >= 23) {
          const importe = this.extractNumber(row[22] || "0");
          projectedIncome += importe;
        }
      }

      // Calcular pendientes: lo que se espera cobrar menos lo ya cobrado
      const pendingIncome = projectedIncome - currentIncome;

      return {
        currentIncome,
        pendingIncome: Math.max(0, pendingIncome), // Asegurar que no sea negativo
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
