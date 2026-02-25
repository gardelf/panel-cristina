import { describe, it, expect, vi, beforeEach } from "vitest";
import { FireflyService } from "./firefly";
import type { AxiosInstance } from "axios";

describe("FireflyService - getCurrentMonthExpensesDetailed", () => {
  let service: FireflyService;
  let mockClient: Partial<AxiosInstance>;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
    };

    service = new FireflyService({
      baseUrl: "https://firefly.example.com",
      token: "test-token",
    });

    // Reemplazar el cliente con el mock
    (service as any).client = mockClient;
  });

  it("debe retornar transacciones del mes actual con detalle", async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: "1",
            type: "withdrawal",
            attributes: {
              transactions: [
                {
                  amount: "-50.00",
                  date: "2026-02-15",
                  description: "Supermercado",
                  category_name: "Comida",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                },
              ],
            },
          },
          {
            id: "2",
            type: "withdrawal",
            attributes: {
              transactions: [
                {
                  amount: "-100.00",
                  date: "2026-02-20",
                  description: "Gasolina",
                  category_name: "Transporte",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                },
              ],
            },
          },
        ],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCurrentMonthExpensesDetailed();

    expect(result.total).toBe(150);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toEqual({
      id: "1",
      description: "Supermercado",
      amount: -50,
      date: "2026-02-15",
      category: "Comida",
    });
    expect(result.transactions[1]).toEqual({
      id: "2",
      description: "Gasolina",
      amount: -100,
      date: "2026-02-20",
      category: "Transporte",
    });
  });

  it("debe retornar 0 y array vacío cuando no hay transacciones", async () => {
    const mockResponse = {
      data: {
        data: [],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCurrentMonthExpensesDetailed();

    expect(result.total).toBe(0);
    expect(result.transactions).toHaveLength(0);
  });

  it("debe manejar transacciones sin categoría", async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: "1",
            type: "withdrawal",
            attributes: {
              transactions: [
                {
                  amount: "-30.00",
                  date: "2026-02-10",
                  description: "Compra sin categoría",
                  source_name: "Cuenta Corriente",
                  destination_name: "Personal",
                },
              ],
            },
          },
        ],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCurrentMonthExpensesDetailed();

    expect(result.transactions[0].category).toBeNull();
  });

  it("debe usar las fechas correctas del mes actual", async () => {
    vi.mocked(mockClient.get!).mockResolvedValueOnce({
      data: { data: [] },
    });

    await service.getCurrentMonthExpensesDetailed();

    const now = new Date();
    const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    expect(mockClient.get).toHaveBeenCalledWith("/transactions", {
      params: {
        start: expectedStart,
        end: expectedEnd,
        type: "withdrawal",
      },
    });
  });
});
