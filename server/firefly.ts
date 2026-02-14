import axios, { AxiosInstance } from "axios";

interface FireflyConfig {
  baseUrl: string;
  token: string;
}

interface Transaction {
  id: string;
  type: string;
  attributes: {
    transactions: Array<{
      amount: string;
      date: string;
      description: string;
      category_name?: string;
    }>;
  };
}

interface TransactionResponse {
  data: Transaction[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}

export class FireflyService {
  private client: AxiosInstance;
  private enabled: boolean;

  constructor(config?: FireflyConfig) {
    this.enabled = Boolean(config?.baseUrl && config?.token);
    
    if (this.enabled && config) {
      this.client = axios.create({
        baseURL: `${config.baseUrl}/api/v1`,
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });
    } else {
      // Cliente dummy para cuando no hay configuración
      this.client = axios.create();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Obtiene transacciones en un rango de fechas
   */
  async getTransactions(startDate: Date, endDate: Date, type: "withdrawal" | "deposit" = "withdrawal"): Promise<Transaction[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await this.client.get<TransactionResponse>("/transactions", {
        params: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          type,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error("[Firefly] Error fetching transactions:", error);
      throw new Error("Error al obtener transacciones de Firefly III");
    }
  }

  /**
   * Calcula el total de gastos de un conjunto de transacciones
   */
  calculateTotal(transactions: Transaction[]): number {
    return transactions.reduce((total, transaction) => {
      const amounts = transaction.attributes.transactions.map((t) =>
        parseFloat(t.amount)
      );
      return total + amounts.reduce((sum, amount) => sum + Math.abs(amount), 0);
    }, 0);
  }

  /**
   * Obtiene gastos del mes actual
   */
  async getCurrentMonthExpenses(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await this.getTransactions(startOfMonth, endOfMonth, "withdrawal");
    return this.calculateTotal(transactions);
  }

  /**
   * Obtiene gastos de la última semana
   */
  async getLastWeekExpenses(): Promise<number> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const transactions = await this.getTransactions(lastWeek, now, "withdrawal");
    return this.calculateTotal(transactions);
  }

  /**
   * Obtiene gastos de ayer
   */
  async getYesterdayExpenses(): Promise<number> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);

    const transactions = await this.getTransactions(yesterday, yesterdayEnd, "withdrawal");
    return this.calculateTotal(transactions);
  }

  /**
   * Obtiene gastos extraordinarios previstos del próximo mes
   * Nota: Firefly III no tiene un concepto nativo de "gastos previstos extraordinarios"
   * Esta función busca transacciones recurrentes o con tags específicos
   */
  async getNextMonthExtraordinaryExpenses(): Promise<number> {
    // Por ahora retorna 0, se puede implementar lógica específica
    // basada en categorías, tags o transacciones recurrentes
    return 0;
  }
}

// Singleton instance
let fireflyService: FireflyService | null = null;

export function getFireflyService(): FireflyService {
  if (!fireflyService) {
    const baseUrl = process.env.FIREFLY_BASE_URL;
    const token = process.env.FIREFLY_API_TOKEN;

    if (baseUrl && token) {
      fireflyService = new FireflyService({ baseUrl, token });
    } else {
      fireflyService = new FireflyService();
    }
  }

  return fireflyService;
}
