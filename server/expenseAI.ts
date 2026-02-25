/**
 * Expense AI Service
 * Extrae información de gastos desde texto natural usando OpenAI GPT-4o-mini
 */

import { invokeLLM } from "./_core/llm";

// Categorías conocidas (replicadas del sistema Python)
export const CATEGORIAS_CONOCIDAS: Record<string, string[]> = {
  "Comida": ["mercadona", "lidl", "carrefour", "supermercado", "restaurante", "comida", "cena", "desayuno", "almuerzo"],
  "Coche": ["gasolina", "repsol", "cepsa", "taller", "mecánico", "parking", "aparcamiento", "peaje", "autopista"],
  "Salud": ["farmacia", "médico", "doctor", "hospital", "clínica", "dentista", "seguro médico"],
  "Transporte": ["taxi", "uber", "cabify", "metro", "bus", "tren", "renfe", "avión", "vueling"],
  "Ocio": ["cine", "teatro", "concierto", "museo", "parque", "gimnasio", "deporte"],
  "Ropa": ["zara", "h&m", "mango", "ropa", "zapatos", "zapatería"],
  "Casa": ["ikea", "leroy", "bricomart", "ferretería", "muebles", "decoración"],
  "Tecnología": ["media markt", "fnac", "pccomponentes", "ordenador", "móvil", "tablet"],
  "Viajes": ["hotel", "hostal", "airbnb", "booking", "viaje"],
  "Otros": []
};

/**
 * Categoriza un gasto basándose en palabras clave
 */
export function categorizarGasto(descripcion: string): { categoria: string; metodo: string } {
  const descripcionLower = descripcion.toLowerCase();
  
  // Buscar coincidencia exacta en palabras clave
  for (const [categoria, palabrasClave] of Object.entries(CATEGORIAS_CONOCIDAS)) {
    for (const palabra of palabrasClave) {
      if (descripcionLower.includes(palabra)) {
        return { categoria, metodo: "keyword" };
      }
    }
  }
  
  // Si no hay coincidencia, devolver "Otros"
  return { categoria: "Otros", metodo: "default" };
}

/**
 * Extrae monto, descripción, fecha, categoría y tags desde texto natural usando IA
 */
export async function extraerDatosConIA(texto: string): Promise<{
  monto: number | null;
  descripcion: string | null;
  fecha: string | null;
  categoria: string | null;
  tags: string[];
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres un asistente que extrae información de gastos desde texto natural en español.

IMPORTANTE: La fecha de HOY es ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}.

Extrae:
1. monto (número decimal, sin símbolo de moneda)
2. descripcion (texto descriptivo del gasto)
3. fecha (formato YYYY-MM-DD, solo si se menciona explícitamente una fecha diferente a hoy)
4. categoria (una de: ${Object.keys(CATEGORIAS_CONOCIDAS).join(", ")})
5. tags (array de strings, incluye "Extraordinario" si se menciona "extraordinario" o "previsto")

Reglas:
- Si NO se menciona fecha explícitamente, devuelve null en fecha (se asume hoy)
- Si se dice "extraordinario" o "previsto", DEBES incluir "Extraordinario" en tags
- Si se menciona una fecha futura, es probable que sea un gasto extraordinario previsto
- La descripción debe ser concisa pero descriptiva

Ejemplos:
- "25.50 Mercadona" → monto: 25.50, descripcion: "Mercadona", fecha: null, categoria: "Comida", tags: []
- "500 viaje extraordinario 15 febrero" → monto: 500, descripcion: "viaje", fecha: "2026-02-15", categoria: "Viajes", tags: ["Extraordinario"]
- "30 gasolina Repsol" → monto: 30, descripcion: "gasolina Repsol", fecha: null, categoria: "Coche", tags: []
- "100 dentista previsto marzo" → monto: 100, descripcion: "dentista", fecha: "2026-03-01", categoria: "Salud", tags: ["Extraordinario"]

Responde SOLO con JSON válido.`
        },
        {
          role: "user",
          content: texto
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "expense_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              monto: {
                type: ["number", "null"],
                description: "Monto del gasto en euros"
              },
              descripcion: {
                type: ["string", "null"],
                description: "Descripción del gasto"
              },
              fecha: {
                type: ["string", "null"],
                description: "Fecha del gasto en formato YYYY-MM-DD, null si es hoy"
              },
              categoria: {
                type: ["string", "null"],
                description: "Categoría del gasto"
              },
              tags: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Tags del gasto, incluye 'Extraordinario' si aplica"
              }
            },
            required: ["monto", "descripcion", "fecha", "categoria", "tags"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No se recibió respuesta de la IA");
    }

    // Asegurar que content es string
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    
    return {
      monto: parsed.monto,
      descripcion: parsed.descripcion,
      fecha: parsed.fecha,
      categoria: parsed.categoria,
      tags: parsed.tags || []
    };
  } catch (error) {
    console.error("Error al extraer datos con IA:", error);
    throw new Error(`Error al procesar texto con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
}
