/**
 * Expense AI Service
 * Extrae información de gastos desde texto natural usando OpenAI GPT-4o-mini
 * Usa BUILT_IN_FORGE_API_KEY (Manus) si está disponible, o OPENAI_API_KEY como fallback
 */

async function callLLM(
  messages: Array<{ role: string; content: string }>,
  responseFormat?: any
): Promise<any> {
  const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const apiKey = forgeApiKey && forgeApiKey.trim()
    ? forgeApiKey.trim()
    : openaiApiKey?.trim();

  const apiUrl = forgeApiUrl && forgeApiUrl.trim()
    ? `${forgeApiUrl.trim().replace(/\/$/, "")}/v1/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

  if (!apiKey) {
    throw new Error("No hay API key configurada (BUILT_IN_FORGE_API_KEY ni OPENAI_API_KEY)");
  }

  const body: any = { model: "gpt-4o-mini", messages };
  if (responseFormat) body.response_format = responseFormat;

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${errText}`);
  }
  return resp.json();
}

// Categorías conocidas (configuración específica del usuario)
export const CATEGORIAS_CONOCIDAS: Record<string, string[]> = {
  "Comida": ["mercadona", "lidl", "carrefour", "supermercado", "restaurante", "comida", "cena", "desayuno", "almuerzo", "menu", "bar", "cafetería"],
  "Salud": ["farmacia", "médico", "doctor", "hospital", "clínica", "dentista", "seguro médico", "consulta"],
  "Ropa y accesorios": ["zara", "h&m", "mango", "ropa", "zapatos", "zapatería", "complementos", "accesorios", "bolso", "cinturón"],
  "Coche": ["gasolina", "repsol", "cepsa", "taller", "mecánico", "parking", "aparcamiento", "peaje", "autopista", "seguro coche", "itv"],
  "Ocio": ["cine", "teatro", "concierto", "museo", "parque", "ocio", "entretenimiento", "salir"],
  "Deporte entrenamiento": ["gimnasio", "deporte", "entrenamiento", "fitness", "piscina", "yoga", "pilates", "running"],
  "Trámites": ["notaría", "gestoría", "registro", "trámite", "hacienda", "impuesto", "multa", "tasa"],
  "Casa": ["ikea", "leroy", "bricomart", "ferretería", "muebles", "decoración", "alquiler", "hipoteca", "luz", "agua", "gas", "internet"],
  "Viajes": ["hotel", "hostal", "airbnb", "booking", "viaje", "avión", "tren", "vueling", "renfe"],
  "Inversión": ["inversión", "acciones", "fondo", "bolsa", "criptomoneda", "ahorro"]
};

/**
 * Categoriza un gasto basándose en palabras clave
 */
export function categorizarGasto(descripcion: string): { categoria: string; metodo: string } {
  const descripcionLower = descripcion.toLowerCase();

  for (const [categoria, palabrasClave] of Object.entries(CATEGORIAS_CONOCIDAS)) {
    for (const palabra of palabrasClave) {
      if (descripcionLower.includes(palabra)) {
        return { categoria, metodo: "keyword" };
      }
    }
  }

  return { categoria: "", metodo: "default" };
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
    const response = await callLLM(
      [
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

Responde SOLO con JSON válido.`,
        },
        {
          role: "user",
          content: texto,
        },
      ],
      {
        type: "json_schema",
        json_schema: {
          name: "expense_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              monto: { type: ["number", "null"], description: "Monto del gasto en euros" },
              descripcion: { type: ["string", "null"], description: "Descripción del gasto" },
              fecha: { type: ["string", "null"], description: "Fecha del gasto en formato YYYY-MM-DD, null si es hoy" },
              categoria: { type: ["string", "null"], description: "Categoría del gasto" },
              tags: { type: "array", items: { type: "string" }, description: "Tags del gasto" },
            },
            required: ["monto", "descripcion", "fecha", "categoria", "tags"],
            additionalProperties: false,
          },
        },
      }
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No se recibió respuesta de la IA");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    return {
      monto: parsed.monto,
      descripcion: parsed.descripcion,
      fecha: parsed.fecha,
      categoria: parsed.categoria,
      tags: parsed.tags || [],
    };
  } catch (error) {
    console.error("Error al extraer datos con IA:", error);
    throw new Error(`Error al procesar texto con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
}
