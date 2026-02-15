import { describe, it, expect, vi, beforeEach } from "vitest";
import { FireflyService } from "./firefly";
import type { Transaction, TransactionResponse } from "./firefly";

describe("FireflyService - Filtro de gastos por cuenta de destino", () => {
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

  it("debe filtrar solo transacciones con destino Personal para gastos", async () => {
    // Mock de respuesta de Firefly con transacciones mixtas
    const mockResponse: TransactionResponse = {
      data: [
        {
          type: "transactions",
          id: "1",
          attributes: {
            transactions: [
              {
                description: "Gasto personal 1",
                amount: "100.00",
                date: "2026-02-01",
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
                description: "Gasto del estudio",
                amount: "500.00",
                date: "2026-02-05",
                source_name: "Cuenta Corriente",
                destination_name: "Estudio",
                category_name: "Material",
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
                description: "Gasto personal 2",
                amount: "50.00",
                date: "2026-02-10",
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

    // Ejecutar método
    const startDate = new Date("2026-02-01");
    const endDate = new Date("2026-02-28");
    const transactions = await service.getTransactions(startDate, endDate, "withdrawal");

    // Verificar que solo devuelve transacciones con destino Personal
    expect(transactions).toHaveLength(2);
    expect(transactions[0].id).toBe("1");
    expect(transactions[1].id).toBe("3");

    // Verificar que no incluye transacciones con destino Estudio
    const hasEstudioTransaction = transactions.some((t) =>
      t.attributes.transactions.some((tx) => tx.destination_name === "Estudio")
    );
    expect(hasEstudioTransaction).toBe(false);
  });

  it("debe calcular correctamente el total de gastos personales", async () => {
    const mockResponse: TransactionResponse = {
      data: [
        {
          type: "transactions",
          id: "1",
          attributes: {
            transactions: [
              {
                description: "Gasto personal 1",
                amount: "100.00",
                date: "2026-02-01",
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
                description: "Gasto personal 2",
                amount: "50.00",
                date: "2026-02-10",
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

    const startDate = new Date("2026-02-01");
    const endDate = new Date("2026-02-28");
    const transactions = await service.getTransactions(startDate, endDate, "withdrawal");
    const total = service.calculateTotal(transactions);

    expect(total).toBe(150); // 100 + 50
  });

  it("debe devolver todas las transacciones para deposits sin filtrar", async () => {
    const mockResponse: TransactionResponse = {
      data: [
        {
          type: "transactions",
          id: "1",
          attributes: {
            transactions: [
              {
                description: "Ingreso 1",
                amount: "1000.00",
                date: "2026-02-01",
                source_name: "Cliente A",
                destination_name: "Cuenta Corriente",
                category_name: "Ingresos",
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
                description: "Ingreso 2",
                amount: "500.00",
                date: "2026-02-05",
                source_name: "Cliente B",
                destination_name: "Estudio",
                category_name: "Ingresos",
              },
            ],
          },
        },
      ],
    };

    mockClient.get.mockResolvedValue({ data: mockResponse });

    const startDate = new Date("2026-02-01");
    const endDate = new Date("2026-02-28");
    const transactions = await service.getTransactions(startDate, endDate, "deposit");

    // Para deposits, no debe filtrar
    expect(transactions).toHaveLength(2);
  });

  it("debe manejar transacciones sin destination_name", async () => {
    const mockResponse: TransactionResponse = {
      data: [
        {
          type: "transactions",
          id: "1",
          attributes: {
            transactions: [
              {
                description: "Gasto sin destino",
                amount: "100.00",
                date: "2026-02-01",
                source_name: "Cuenta Corriente",
                destination_name: undefined,
                category_name: "Varios",
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
                description: "Gasto personal",
                amount: "50.00",
                date: "2026-02-10",
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

    const startDate = new Date("2026-02-01");
    const endDate = new Date("2026-02-28");
    const transactions = await service.getTransactions(startDate, endDate, "withdrawal");

    // Solo debe devolver la transacción con destino Personal
    expect(transactions).toHaveLength(1);
    expect(transactions[0].id).toBe("2");
  });
});
