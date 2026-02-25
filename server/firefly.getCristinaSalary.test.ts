import { describe, it, expect, vi, beforeEach } from "vitest";
import { FireflyService } from "./firefly";
import type { AxiosInstance } from "axios";

describe("FireflyService - getCristinaSalary", () => {
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

  it("debe retornar el monto de la nómina cuando existe la transacción", async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: "1",
            type: "withdrawal",
            attributes: {
              transactions: [
                {
                  amount: "-2500.00",
                  date: "2026-02-15",
                  description: "Nomina Cristina",
                  category_name: "Salario",
                  source_name: "Empresa",
                  destination_name: "Cuenta Corriente",
                },
              ],
            },
          },
        ],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCristinaSalary();

    expect(result).toBe(2500);
    expect(mockClient.get).toHaveBeenCalledWith("/transactions", {
      params: expect.objectContaining({
        type: "withdrawal",
      }),
    });
  });

  it("debe retornar 0 cuando no existe la transacción", async () => {
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
                  description: "Compra supermercado",
                  category_name: "Comida",
                },
              ],
            },
          },
        ],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCristinaSalary();

    expect(result).toBe(0);
  });

  it("debe buscar case-insensitive", async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: "1",
            type: "withdrawal",
            attributes: {
              transactions: [
                {
                  amount: "-2500.00",
                  date: "2026-02-15",
                  description: "NOMINA CRISTINA",
                  category_name: "Salario",
                },
              ],
            },
          },
        ],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCristinaSalary();

    expect(result).toBe(2500);
  });

  it("debe retornar 0 cuando Firefly no está habilitado", async () => {
    const disabledService = new FireflyService();
    const result = await disabledService.getCristinaSalary();

    expect(result).toBe(0);
  });

  it("debe manejar errores de API", async () => {
    vi.mocked(mockClient.get!).mockRejectedValueOnce(new Error("API Error"));

    const result = await service.getCristinaSalary();

    expect(result).toBe(0);
  });

  it("debe retornar el primer resultado cuando hay múltiples transacciones con el mismo nombre", async () => {
    const mockResponse = {
      data: {
        data: [
          {
            id: "1",
            type: "withdrawal",
            attributes: {
              transactions: [
                {
                  amount: "-2500.00",
                  date: "2026-02-15",
                  description: "Nomina Cristina",
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
                  amount: "-3000.00",
                  date: "2026-02-20",
                  description: "Nomina Cristina Extra",
                },
              ],
            },
          },
        ],
      },
    };

    vi.mocked(mockClient.get!).mockResolvedValueOnce(mockResponse);

    const result = await service.getCristinaSalary();

    expect(result).toBe(2500);
  });
});
