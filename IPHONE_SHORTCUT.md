# Configuración del Atajo de iPhone para Registrar Gastos

Este documento explica cómo configurar un atajo de iPhone (Siri Shortcut) para registrar gastos por voz que se enviarán automáticamente a Firefly III a través de tu Panel de Control.

## 📱 Requisitos

- iPhone con iOS 13 o superior
- App "Atajos" (Shortcuts) instalada
- Panel de Control publicado y accesible desde internet

## 🔗 Endpoint API

Tu panel expone el siguiente endpoint para crear gastos:

```
POST https://tu-dominio.manus.space/api/trpc/expenses.create
```

**Nota:** Reemplaza `tu-dominio.manus.space` con tu dominio real una vez publiques el panel.

## 📝 Formato de Datos

El endpoint espera un JSON con el siguiente formato:

```json
{
  "description": "Descripción del gasto",
  "amount": 25.50,
  "date": "2026-02-15",
  "category": "Alimentación",
  "sourceAccount": "Cuenta Corriente",
  "destinationAccount": "Personal"
}
```

### Campos

| Campo | Tipo | Requerido | Descripción | Valor por defecto |
|-------|------|-----------|-------------|-------------------|
| `description` | string | ✅ Sí | Descripción del gasto | - |
| `amount` | number | ✅ Sí | Monto del gasto (positivo) | - |
| `date` | string | ❌ No | Fecha en formato YYYY-MM-DD | Fecha actual |
| `category` | string | ❌ No | Categoría del gasto | null |
| `sourceAccount` | string | ❌ No | Cuenta de origen | "Cuenta Corriente" |
| `destinationAccount` | string | ❌ No | Cuenta de destino | "Personal" |

## 🎯 Configuración del Atajo (Paso a Paso)

### Opción 1: Atajo Simple (Sin IA)

1. **Abrir app Atajos** en tu iPhone
2. **Crear nuevo atajo** (botón +)
3. **Agregar acciones** en este orden:

#### Acción 1: Dictar texto
- Buscar "Dictar texto"
- Configurar: "Mostrar al ejecutar"

#### Acción 2: Pedir entrada
- Buscar "Pedir entrada"
- Tipo: Número
- Pregunta: "¿Cuánto gastaste?"

#### Acción 3: Obtener contenido de URL
- Buscar "Obtener contenido de URL"
- URL: `https://tu-dominio.manus.space/api/trpc/expenses.create`
- Método: POST
- Headers:
  - `Content-Type`: `application/json`
- Cuerpo de solicitud: JSON
- JSON:
```json
{
  "description": "[Texto dictado]",
  "amount": [Número proporcionado]
}
```

#### Acción 4: Mostrar notificación
- Buscar "Mostrar notificación"
- Título: "Gasto registrado"
- Cuerpo: "Se ha guardado correctamente en Firefly"

4. **Nombrar el atajo**: "Registrar Gasto"
5. **Agregar a pantalla de inicio** (opcional)
6. **Configurar con Siri**: "Oye Siri, registrar gasto"

---

### Opción 2: Atajo Inteligente (Con IA para extraer datos)

Esta opción usa la API de LLM integrada en tu panel para extraer automáticamente descripción, monto y categoría desde una frase dictada.

#### Paso 1: Crear endpoint de procesamiento con IA

Primero, necesitas agregar un endpoint que procese el texto dictado y extraiga los datos estructurados.

**Agregar al archivo `server/routers.ts`:**

```typescript
// Dentro del router expenses, agregar:
parseVoiceInput: publicProcedure
  .input(z.object({
    text: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { invokeLLM } = await import("./_core/llm");
    
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Eres un asistente que extrae información de gastos desde texto en español. Responde SOLO con JSON válido."
          },
          {
            role: "user",
            content: `Extrae la descripción, monto y categoría del siguiente gasto: "${input.text}"\n\nCategorías válidas: Alimentación, Transporte, Ocio, Salud, Vivienda, Educación, Ropa, Otros.\n\nRespuesta en formato JSON: {"description": "...", "amount": 0.00, "category": "..."}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "expense_data",
            strict: true,
            schema: {
              type: "object",
              properties: {
                description: { type: "string" },
                amount: { type: "number" },
                category: { type: "string" }
              },
              required: ["description", "amount"],
              additionalProperties: false
            }
          }
        }
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      return parsed;
    } catch (error: any) {
      console.error("[Expenses] Error parsing voice input:", error);
      throw new Error("Error al procesar el texto");
    }
  }),
```

#### Paso 2: Configurar el atajo en iPhone

1. **Abrir app Atajos**
2. **Crear nuevo atajo**
3. **Agregar acciones**:

##### Acción 1: Dictar texto
- "Dictar texto"
- Mostrar al ejecutar

##### Acción 2: Obtener contenido de URL (Parsear con IA)
- URL: `https://tu-dominio.manus.space/api/trpc/expenses.parseVoiceInput`
- Método: POST
- Headers: `Content-Type: application/json`
- JSON:
```json
{
  "text": "[Texto dictado]"
}
```

##### Acción 3: Obtener valor del diccionario
- Clave: `result.data`
- Guardar en variable: `DatosGasto`

##### Acción 4: Obtener contenido de URL (Crear gasto)
- URL: `https://tu-dominio.manus.space/api/trpc/expenses.create`
- Método: POST
- Headers: `Content-Type: application/json`
- JSON:
```json
{
  "description": "[DatosGasto.description]",
  "amount": [DatosGasto.amount],
  "category": "[DatosGasto.category]"
}
```

##### Acción 5: Mostrar notificación
- Título: "Gasto registrado"
- Cuerpo: "[DatosGasto.description] - [DatosGasto.amount]€"

4. **Nombrar**: "Registrar Gasto con Voz"
5. **Activar con Siri**: "Oye Siri, registrar gasto con voz"

---

## 🗣️ Ejemplos de Uso

### Opción 1 (Simple):
1. Activar: "Oye Siri, registrar gasto"
2. Dictar: "Compra en el supermercado"
3. Ingresar monto: 45.50
4. ✅ Gasto registrado

### Opción 2 (Con IA):
1. Activar: "Oye Siri, registrar gasto con voz"
2. Dictar: "Gasté 35 euros en gasolina"
3. ✅ Gasto registrado automáticamente:
   - Descripción: "Gasolina"
   - Monto: 35.00
   - Categoría: "Transporte"

---

## 🔧 Solución de Problemas

### Error: "No se pudo conectar"
- Verifica que el panel esté publicado y accesible desde internet
- Comprueba que la URL sea correcta (con `https://`)

### Error: "Firefly III no está configurado"
- Asegúrate de que `FIREFLY_API_TOKEN` y `FIREFLY_BASE_URL` estén configurados en las variables de entorno del panel

### El gasto no aparece en Firefly
- Revisa los logs del servidor en el panel
- Verifica que las cuentas "Cuenta Corriente" y "Personal" existan en Firefly III
- Comprueba que el token de Firefly tenga permisos de escritura

### La IA no extrae bien los datos (Opción 2)
- Dicta frases más claras: "Gasté [monto] euros en [descripción]"
- Menciona la categoría explícitamente: "Gasté 20 euros en comida, categoría alimentación"

---

## 📊 Integración con el Panel

Una vez registrado el gasto:

1. El gasto se crea inmediatamente en Firefly III
2. Aparecerá en el widget "Gastos" del panel en la próxima actualización (máximo 5 minutos)
3. Se incluirá en los cálculos de:
   - "Este mes" (si la cuenta destino es Personal)
   - "Gastos del Estudio" (si la cuenta destino es Estudio)
   - "Margen Personal"

---

## 🎨 Personalización

### Cambiar cuenta de destino por defecto

Edita el endpoint en `server/firefly.ts`:

```typescript
destination_name: data.destinationAccount || "Estudio", // Cambiar "Personal" por "Estudio"
```

### Agregar más categorías

Modifica el prompt del sistema en el endpoint `parseVoiceInput` para incluir tus categorías personalizadas.

---

## 📱 Alternativa: Interfaz Web

Si prefieres no usar atajos de iPhone, puedes crear una interfaz web simple en el panel:

1. Agregar una página `/gastos/nuevo`
2. Formulario con campos: descripción, monto, categoría
3. Botón "Guardar" que llama a `trpc.expenses.create.useMutation()`

Esto te permitiría registrar gastos desde cualquier dispositivo con navegador.

---

## 🚀 Próximos Pasos

1. **Publicar el panel** haciendo clic en "Publish" en la UI de Manus
2. **Copiar la URL** del panel publicado
3. **Configurar el atajo** siguiendo las instrucciones de este documento
4. **Probar** registrando un gasto de prueba
5. **Verificar** en Firefly III que el gasto se haya creado correctamente

---

¿Necesitas ayuda? Revisa los logs del servidor en `.manus-logs/devserver.log` para ver detalles de errores.
