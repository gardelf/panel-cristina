import { describe, it, expect, vi } from "vitest";
import { categorizarGasto, extraerDatosConIA, CATEGORIAS_CONOCIDAS } from "./expenseAI";

describe("expenseAI", () => {
  describe("categorizarGasto", () => {
    it("debe categorizar 'Mercadona' como Comida", () => {
      const result = categorizarGasto("Mercadona");
      expect(result.categoria).toBe("Comida");
      expect(result.metodo).toBe("keyword");
    });

    it("debe categorizar 'gasolina Repsol' como Coche", () => {
      const result = categorizarGasto("gasolina Repsol");
      expect(result.categoria).toBe("Coche");
      expect(result.metodo).toBe("keyword");
    });

    it("debe categorizar 'farmacia' como Salud", () => {
      const result = categorizarGasto("farmacia");
      expect(result.categoria).toBe("Salud");
      expect(result.metodo).toBe("keyword");
    });

    it("debe retornar vacío para texto desconocido (IA decidirá)", () => {
      const result = categorizarGasto("algo completamente desconocido");
      expect(result.categoria).toBe("");
      expect(result.metodo).toBe("default");
    });

    it("debe ser case-insensitive", () => {
      const result = categorizarGasto("MERCADONA");
      expect(result.categoria).toBe("Comida");
    });
  });

  describe("extraerDatosConIA", () => {
    // Mock de invokeLLM
    vi.mock("./_core/llm", () => ({
      invokeLLM: vi.fn(),
    }));

    it("debe extraer monto y descripción simple", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                monto: 25.5,
                descripcion: "Mercadona",
                fecha: null,
                categoria: "Comida",
                tags: [],
              }),
            },
          },
        ],
      } as any);

      const result = await extraerDatosConIA("25.50 Mercadona");
      
      expect(result.monto).toBe(25.5);
      expect(result.descripcion).toBe("Mercadona");
      expect(result.fecha).toBeNull();
      expect(result.categoria).toBe("Comida");
      expect(result.tags).toEqual([]);
    });

    it("debe extraer gasto extraordinario con fecha", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                monto: 500,
                descripcion: "viaje",
                fecha: "2026-02-15",
                categoria: "Viajes",
                tags: ["Extraordinario"],
              }),
            },
          },
        ],
      } as any);

      const result = await extraerDatosConIA("500 viaje extraordinario 15 febrero");
      
      expect(result.monto).toBe(500);
      expect(result.descripcion).toBe("viaje");
      expect(result.fecha).toBe("2026-02-15");
      expect(result.categoria).toBe("Viajes");
      expect(result.tags).toContain("Extraordinario");
    });

    it("debe manejar error cuando la IA no devuelve respuesta", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [],
      } as any);

      await expect(extraerDatosConIA("texto inválido")).rejects.toThrow(
        "No se recibió respuesta de la IA"
      );
    });

    it("debe manejar error de parsing JSON", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "invalid json",
            },
          },
        ],
      } as any);

      await expect(extraerDatosConIA("25.50 Mercadona")).rejects.toThrow(
        /Error al procesar texto con IA/
      );
    });
  });

  describe("CATEGORIAS_CONOCIDAS", () => {
    it("debe tener todas las categorías esperadas", () => {
      const expectedCategories = [
        "Comida",
        "Salud",
        "Ropa y accesorios",
        "Coche",
        "Ocio",
        "Deporte entrenamiento",
        "Trámites",
        "Casa",
        "Viajes",
        "Inversión",
      ];

      expectedCategories.forEach((cat) => {
        expect(CATEGORIAS_CONOCIDAS).toHaveProperty(cat);
      });
    });

    it("cada categoría debe tener un array de palabras clave", () => {
      Object.values(CATEGORIAS_CONOCIDAS).forEach((keywords) => {
        expect(Array.isArray(keywords)).toBe(true);
      });
    });
  });
});
