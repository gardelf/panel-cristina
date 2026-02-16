import { describe, it, expect, vi, beforeEach } from "vitest";
import { FireflyService } from "./firefly";

describe("Endpoint expenses.create", () => {
  let service: FireflyService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
    };

    service = new FireflyService({
      baseUrl: "https://test.firefly.com",
      token: "test-token",
    });

    (service as any).client = mockClient;
  });

  describe("createTransaction", () => {
    it("debe crear una transacción con datos mínimos requeridos", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "123",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await service.createTransaction({
        description: "Compra supermercado",
        amount: 45.50,
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("123");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              type: "withdrawal",
              description: "Compra supermercado",
              amount: "45.5",
              source_name: "Cuenta Corriente",
              destination_name: "Personal",
            }),
          ]),
        })
      );
    });

    it("debe crear una transacción con todos los campos opcionales", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "456",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await service.createTransaction({
        description: "Material de oficina",
        amount: 120.00,
        date: "2026-02-15",
        category: "Estudio",
        sourceAccount: "Cuenta Empresa",
        destinationAccount: "Estudio",
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("456");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              type: "withdrawal",
              description: "Material de oficina",
              amount: "120",
              date: "2026-02-15",
              category_name: "Estudio",
              source_name: "Cuenta Empresa",
              destination_name: "Estudio",
            }),
          ]),
        })
      );
    });

    it("debe usar fecha actual cuando no se proporciona", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "789",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const today = new Date().toISOString().split("T")[0];

      const result = await service.createTransaction({
        description: "Gasto sin fecha",
        amount: 25.00,
      });

      expect(result.success).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              date: today,
            }),
          ]),
        })
      );
    });

    it("debe manejar errores de la API de Firefly", async () => {
      const mockError = {
        response: {
          data: {
            message: "Invalid transaction data",
          },
        },
      };

      mockClient.post.mockRejectedValue(mockError);

      const result = await service.createTransaction({
        description: "Transacción inválida",
        amount: -10.00, // Monto negativo
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid transaction data");
    });

    it("debe manejar errores de red", async () => {
      const mockError = new Error("Network error");

      mockClient.post.mockRejectedValue(mockError);

      const result = await service.createTransaction({
        description: "Error de red",
        amount: 50.00,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("debe devolver error cuando Firefly no está habilitado", async () => {
      const disabledService = new FireflyService();

      const result = await disabledService.createTransaction({
        description: "Test",
        amount: 10.00,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firefly III no está configurado");
    });

    it("debe convertir el monto a string correctamente", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "999",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      await service.createTransaction({
        description: "Test conversión",
        amount: 123.456,
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              amount: "123.456",
            }),
          ]),
        })
      );
    });

    it("debe incluir flags de configuración en el payload", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "111",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      await service.createTransaction({
        description: "Test flags",
        amount: 50.00,
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          error_if_duplicate_hash: false,
          apply_rules: true,
          fire_webhooks: true,
        })
      );
    });
  });

  describe("Validación de datos desde iPhone", () => {
    it("debe aceptar datos típicos de entrada por voz", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "voice-123",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      // Simulando datos extraídos por IA desde voz
      const result = await service.createTransaction({
        description: "Gasolina",
        amount: 35.00,
        category: "Transporte",
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("voice-123");
    });

    it("debe manejar descripciones con caracteres especiales", async () => {
      const mockResponse = {
        data: {
          data: {
            id: "special-123",
            type: "transactions",
          },
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const result = await service.createTransaction({
        description: "Café & croissant en 'La Panadería'",
        amount: 5.50,
      });

      expect(result.success).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        "/transactions",
        expect.objectContaining({
          transactions: expect.arrayContaining([
            expect.objectContaining({
              description: "Café & croissant en 'La Panadería'",
            }),
          ]),
        })
      );
    });
  });
});
