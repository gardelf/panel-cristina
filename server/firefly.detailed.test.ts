import { describe, it, expect, vi, beforeEach } from "vitest";
import { FireflyService } from "./firefly";
import type { TransactionResponse } from "./firefly";

describe("FireflyService - Métodos detallados de gastos", () => {
  let service: FireflyService;
  let mockClient: any;

  beforeEach(() => {
    // Mock del cliente axios
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    // Crear servicio con configuración mock
    service = new FireflyService({
      baseUrl: "https://test.firefly.com",
      token: "test-token",
    });

    // Reemplazar el cliente con el mock
    (service as any).client = mockClient;
  });

  describe("getYesterdayExpensesDetailed", () => {
    it("debe devolver total y lista de transacciones de ayer", async () => {
      const mockResponse: TransactionResponse = {
        data: [
          {
            type: "transactions",
            id: "1",
            attributes: {
              transactions: [
                {
                  description: "Compra supermercado",
                  amount: "50.00",
                  date: "2026-02-14",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: "Alimentación",
                },
              ],
            },
          },
          {
            type: "transactions",
            id: "2",
            attributes: {
              transactions: [
                {
                  description: "Gasolina",
                  amount: "60.00",
                  date: "2026-02-14",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: "Transporte",
                },
              ],
            },
          },
        ],
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getYesterdayExpensesDetailed();

      expect(result.total).toBe(110); // 50 + 60
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toMatchObject({
        id: "1",
        description: "Compra supermercado",
        amount: 50,
        category: "Alimentación",
      });
      expect(result.transactions[1]).toMatchObject({
        id: "2",
        description: "Gasolina",
        amount: 60,
        category: "Transporte",
      });
    });

    it("debe devolver lista vacía cuando no hay transacciones de ayer", async () => {
      const mockResponse: TransactionResponse = {
        data: [],
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getYesterdayExpensesDetailed();

      expect(result.total).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });
  });

  describe("getNextMonthExtraordinaryExpensesDetailed", () => {
    it("debe devolver total y lista de gastos extraordinarios del próximo mes", async () => {
      const mockResponse: TransactionResponse = {
        data: [
          {
            type: "transactions",
            id: "1",
            attributes: {
              transactions: [
                {
                  description: "Seguro anual",
                  amount: "200.00",
                  date: "2026-03-15",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: "Seguros",
                  tags: ["extraordinario"],
                },
              ],
            },
          },
          {
            type: "transactions",
            id: "2",
            attributes: {
              transactions: [
                {
                  description: "Reparación coche",
                  amount: "350.00",
                  date: "2026-03-20",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: "Mantenimiento",
                  tags: ["extraordinaria"],
                },
              ],
            },
          },
          {
            type: "transactions",
            id: "3",
            attributes: {
              transactions: [
                {
                  description: "Compra normal",
                  amount: "50.00",
                  date: "2026-03-10",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: "Alimentación",
                  tags: [],
                },
              ],
            },
          },
        ],
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getNextMonthExtraordinaryExpensesDetailed();

      // Solo debe incluir transacciones con etiqueta "extraordinario"
      expect(result.total).toBe(550); // 200 + 350
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toMatchObject({
        id: "1",
        description: "Seguro anual",
        amount: 200,
        category: "Seguros",
      });
      expect(result.transactions[1]).toMatchObject({
        id: "2",
        description: "Reparación coche",
        amount: 350,
        category: "Mantenimiento",
      });
    });

    it("debe devolver lista vacía cuando no hay gastos extraordinarios", async () => {
      const mockResponse: TransactionResponse = {
        data: [
          {
            type: "transactions",
            id: "1",
            attributes: {
              transactions: [
                {
                  description: "Compra normal",
                  amount: "50.00",
                  date: "2026-03-10",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: "Alimentación",
                  tags: [],
                },
              ],
            },
          },
        ],
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getNextMonthExtraordinaryExpensesDetailed();

      expect(result.total).toBe(0);
      expect(result.transactions).toHaveLength(0);
    });

    it("debe manejar transacciones sin categoría", async () => {
      const mockResponse: TransactionResponse = {
        data: [
          {
            type: "transactions",
            id: "1",
            attributes: {
              transactions: [
                {
                  description: "Gasto sin categoría",
                  amount: "100.00",
                  date: "2026-03-15",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                  category_name: null,
                  tags: ["extraordinario"],
                },
              ],
            },
          },
        ],
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getNextMonthExtraordinaryExpensesDetailed();

      expect(result.total).toBe(100);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].category).toBeNull();
    });
  });
});
