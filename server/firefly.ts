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
      source_name?: string;
      destination_name?: string;
    }>;
  };
}

export interface TransactionDetail {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
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
          "X-Firefly-Administration": "1", // Para multi-tenancy
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
   * Crea una nueva transacción de gasto en Firefly III
   */
  async createTransaction(data: {
    description: string;
    amount: number;
    date?: string;
    category?: string;
    sourceAccount?: string;
    destinationAccount?: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (!this.enabled) {
      return { success: false, error: "Firefly III no está configurado" };
    }

    try {
      const transactionDate = data.date || new Date().toISOString().split("T")[0];
      
      const payload = {
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
        transactions: [
          {
            type: "withdrawal",
            date: transactionDate,
            amount: data.amount.toString(),
            description: data.description,
            source_name: data.sourceAccount || "Cuenta Corriente",
            destination_name: data.destinationAccount || "Personal",
            category_name: data.category || null,
          },
        ],
      };

      const response = await this.client.post("/transactions", payload);
      
      return {
        success: true,
        transactionId: response.data.data.id,
      };
    } catch (error: any) {
      console.error("Error creating transaction in Firefly:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Error desconocido",
      };
    }
  }

  /**
   * Obtiene transacciones en un rango de fechas
   * Para gastos (withdrawal), filtra solo cuenta de destino "Personal"
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

      const allTransactions = response.data.data || [];

      // Si es withdrawal, filtrar solo cuenta de destino "Personal"
      if (type === "withdrawal") {
        return allTransactions.filter((transaction) => {
          return transaction.attributes.transactions.some((t) => {
            const destinationName = t.destination_name?.toLowerCase() || "";
            return destinationName.includes("personal");
          });
        });
      }

      return allTransactions;
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
   * Obtiene gastos de ayer con detalle de transacciones
   */
  async getYesterdayExpensesDetailed(): Promise<{
    total: number;
    transactions: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      category: string | null;
    }>;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);

    const transactions = await this.getTransactions(yesterday, yesterdayEnd, "withdrawal");
    const total = this.calculateTotal(transactions);

    const transactionList = transactions.map((t) => {
      const tx = t.attributes.transactions[0];
      return {
        id: t.id,
        description: tx.description,
        amount: parseFloat(tx.amount),
        date: tx.date,
        category: tx.category_name || null,
      };
    });

    return { total, transactions: transactionList };
  }

  /**
   * Obtiene gastos del mes actual con detalle de transacciones
   */
  async getCurrentMonthExpensesDetailed(): Promise<{
    total: number;
    transactions: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      category: string | null;
    }>;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await this.getTransactions(startOfMonth, endOfMonth, "withdrawal");
    const total = this.calculateTotal(transactions);

    const transactionList = transactions.map((t) => {
      const tx = t.attributes.transactions[0];
      return {
        id: t.id,
        description: tx.description,
        amount: parseFloat(tx.amount),
        date: tx.date,
        category: tx.category_name || null,
      };
    });

    return { total, transactions: transactionList };
  }

  /**
   * Obtiene gastos extraordinarios previstos del próximo mes
   * Busca transacciones del próximo mes que tengan la etiqueta "extraordinario"
   */
  async getNextMonthExtraordinaryExpenses(): Promise<number> {
    if (!this.enabled) {
      return 0;
    }

    try {
      const now = new Date();
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      // Obtener todas las transacciones del próximo mes
      const response = await this.client.get<TransactionResponse>("/transactions", {
        params: {
          start: startOfNextMonth.toISOString().split("T")[0],
          end: endOfNextMonth.toISOString().split("T")[0],
          type: "withdrawal",
        },
      });

      const transactions = response.data.data || [];

      // Filtrar transacciones que tengan la etiqueta "extraordinario"
      const extraordinaryTransactions = transactions.filter((transaction) => {
        return transaction.attributes.transactions.some((t: any) => {
          const tags = t.tags || [];
          return tags.some((tag: string) => 
            tag.toLowerCase() === "extraordinario" || 
            tag.toLowerCase() === "extraordinaria"
          );
        });
      });

      return this.calculateTotal(extraordinaryTransactions);
    } catch (error) {
      console.error("[Firefly] Error fetching extraordinary expenses:", error);
      return 0;
    }
  }

  /**
   * Obtiene gastos extraordinarios previstos del próximo mes con detalle
   */
  async getNextMonthExtraordinaryExpensesDetailed(): Promise<{
    total: number;
    transactions: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      category: string | null;
    }>;
  }> {
    if (!this.enabled) {
      return { total: 0, transactions: [] };
    }

    try {
      const now = new Date();
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      // Obtener todas las transacciones del próximo mes
      const response = await this.client.get<TransactionResponse>("/transactions", {
        params: {
          start: startOfNextMonth.toISOString().split("T")[0],
          end: endOfNextMonth.toISOString().split("T")[0],
          type: "withdrawal",
        },
      });

      const transactions = response.data.data || [];

      // Filtrar transacciones que tengan la etiqueta "extraordinario"
      const extraordinaryTransactions = transactions.filter((transaction) => {
        return transaction.attributes.transactions.some((t: any) => {
          const tags = t.tags || [];
          return tags.some((tag: string) => 
            tag.toLowerCase() === "extraordinario" || 
            tag.toLowerCase() === "extraordinaria"
          );
        });
      });

      const total = this.calculateTotal(extraordinaryTransactions);

      const transactionList = extraordinaryTransactions.map((t) => {
        const tx = t.attributes.transactions[0];
        return {
          id: t.id,
          description: tx.description,
          amount: parseFloat(tx.amount),
          date: tx.date,
          category: tx.category_name || null,
        };
      });

      return { total, transactions: transactionList };
    } catch (error) {
      console.error("[Firefly] Error fetching extraordinary expenses:", error);
      return { total: 0, transactions: [] };
    }
  }

  /**
   * Obtiene gastos del mes actual de la cuenta "Estudio"
   */
  async getStudioAccountExpenses(): Promise<{
    total: number;
    transactions: TransactionDetail[];
  }> {
    if (!this.enabled) {
      return { total: 0, transactions: [] };
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Obtener todas las transacciones del mes
      const response = await this.client.get<TransactionResponse>("/transactions", {
        params: {
          start: startOfMonth.toISOString().split("T")[0],
          end: endOfMonth.toISOString().split("T")[0],
          type: "withdrawal",
        },
      });

      const allTransactions = response.data.data || [];

      // Filtrar transacciones con cuenta de destino "Estudio"
      const studioTransactions = allTransactions.filter((transaction) => {
        return transaction.attributes.transactions.some((t) => {
          const destinationName = t.destination_name?.toLowerCase() || "";
          return destinationName.includes("estudio");
        });
      });

      // Convertir a formato TransactionDetail
      const transactionDetails: TransactionDetail[] = [];
      studioTransactions.forEach((transaction) => {
        transaction.attributes.transactions.forEach((t) => {
          if (t.destination_name?.toLowerCase().includes("estudio")) {
            transactionDetails.push({
              id: transaction.id,
              date: t.date,
              description: t.description,
              amount: Math.abs(parseFloat(t.amount)),
              category: t.category_name,
            });
          }
        });
      });

      // Ordenar por fecha descendente
      transactionDetails.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const total = transactionDetails.reduce((sum, t) => sum + t.amount, 0);

      return {
        total,
        transactions: transactionDetails,
      };
    } catch (error) {
      console.error("[Firefly] Error fetching studio expenses:", error);
      return { total: 0, transactions: [] };
    }
  }

  /**
   * Obtiene el monto de la nómina de Cristina del mes vigente
   * Busca transacción de tipo withdrawal con descripción "Nomina Cristina"
   */
  async getCristinaSalary(): Promise<number> {
    if (!this.enabled) {
      return 0;
    }

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Obtener todas las transacciones del mes (sin filtro de cuenta destino)
      const response = await this.client.get<TransactionResponse>("/transactions", {
        params: {
          start: startOfMonth.toISOString().split("T")[0],
          end: endOfMonth.toISOString().split("T")[0],
          type: "withdrawal",
        },
      });

      const allTransactions = response.data.data || [];

      // Buscar transacción con descripción "Nomina Cristina" (case-insensitive)
      for (const transaction of allTransactions) {
        for (const t of transaction.attributes.transactions) {
          const description = t.description.toLowerCase();
          if (description.includes("nomina cristina")) {
            return Math.abs(parseFloat(t.amount));
          }
        }
      }

      // Si no se encuentra, retornar 0
      return 0;
    } catch (error) {
      console.error("[Firefly] Error fetching Cristina's salary:", error);
      return 0;
    }
  }

  /**
   * Crea un nuevo gasto en Firefly III
   */
  async createExpense(data: {
    description: string;
    amount: number;
    category: string;
    date: string;
  }): Promise<any> {
    if (!this.enabled) {
      throw new Error("Firefly III no está configurado");
    }

    try {
      // Primero obtener la primera cuenta asset disponible
      const accountsResponse = await this.client.get("/accounts", {
        params: { type: "asset" },
      });
      
      if (!accountsResponse.data.data || accountsResponse.data.data.length === 0) {
        throw new Error("No se encontraron cuentas de activos en Firefly III");
      }
      
      const sourceAccount = accountsResponse.data.data[0].attributes.name;
      
      const payload = {
        error_if_duplicate_hash: false,
        apply_rules: true,
        transactions: [
          {
            type: "withdrawal",
            date: data.date,
            amount: data.amount.toString(),
            description: data.description,
            category_name: data.category,
            source_name: sourceAccount,
            destination_name: data.category, // Usar categoría como destino
          },
        ],
      };

      const response = await this.client.post("/transactions", payload);
      return response.data;
    } catch (error: any) {
      console.error("[Firefly] Error creating expense:", error.response?.data || error.message);
      throw new Error(`Error al crear gasto en Firefly III: ${error.response?.data?.message || error.message}`);
    }
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
