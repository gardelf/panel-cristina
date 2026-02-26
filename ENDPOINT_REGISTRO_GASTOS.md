# Endpoint de Registro de Gastos por Voz

## Información General

Este endpoint permite registrar gastos en Firefly III mediante texto natural usando inteligencia artificial para extraer automáticamente la información relevante.

## URL del Endpoint

**Método**: `POST`  
**URL**: `https://TU-DOMINIO.manus.space/api/trpc/expenses.registerVoice`

> ⚠️ **Nota**: La URL definitiva se obtendrá después de publicar el proyecto en Manus. Reemplaza `TU-DOMINIO` con el dominio real.

## Formato de Solicitud

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "texto": "25.50 Mercadona"
}
```

## Formato de Respuesta

### Respuesta Exitosa
```json
{
  "result": {
    "data": {
      "success": "✅ Registrado: 25.5€ en Comida (Personales)",
      "monto": 25.5,
      "descripcion": "Mercadona",
      "categoria": "Comida",
      "cuentaDestino": "Personales",
      "fecha": null,
      "tags": [],
      "metodo_categorizacion": "keyword",
      "transactionId": "123"
    }
  }
}
```

### Respuesta de Error
```json
{
  "error": {
    "message": "No se pudo extraer monto y descripción del texto",
    "code": "BAD_REQUEST"
  }
}
```

## Configuración del Atajo de iPhone

### Paso 1: Crear Atajo
1. Abrir app **Atajos** en iPhone
2. Crear nuevo atajo
3. Agregar acción: **Pedir texto**
   - Pregunta: "Qué gasto quieres registrar"
   - Permitir varias líneas: ✅

### Paso 2: Configurar Solicitud HTTP
4. Agregar acción: **Obtener contenido de URL**
   - URL: `https://TU-DOMINIO.manus.space/api/trpc/expenses.registerVoice`
   - Método: `POST`
   - Headers: `Content-Type: application/json`
   - Cuerpo de solicitud: `JSON`
   - Agregar campo:
     - Clave: `texto`
     - Tipo: `Texto`
     - Valor: `Solicitar entrada` (texto del paso 1)

### Paso 3: Mostrar Resultado
5. Agregar acción: **Obtener valor para** `success` **en** `Contenido de URL`
6. Agregar acción: **Mostrar notificación**
   - Título: "Gasto Registrado"
   - Cuerpo: `Success` (del paso 5)
   - Reproducir sonido: ✅

## Ejemplos de Uso

### Gasto Simple
```
Entrada: "25.50 Mercadona"
Resultado: ✅ Registrado: 25.5€ en Comida (Personales)
```

### Gasto con Categoría Específica
```
Entrada: "30 gasolina Repsol"
Resultado: ✅ Registrado: 30€ en Coche (Personales)
```

### Gasto del Estudio
```
Entrada: "150 material oficina estudio"
Resultado: ✅ Registrado: 150€ en Casa (Estudio)
```

### Gasto Extraordinario con Fecha
```
Entrada: "500 viaje extraordinario 15 marzo"
Resultado: ✅ Registrado: 500€ en Viajes (Personales) - Fecha: 2026-03-15 - Tags: Extraordinario
```

## Categorías Soportadas

El sistema reconoce automáticamente las siguientes categorías:

- **Comida**: mercadona, lidl, carrefour, supermercado, restaurante, comida, cena, desayuno, almuerzo, menu, bar, cafetería
- **Salud**: farmacia, médico, doctor, hospital, clínica, dentista, seguro médico, consulta
- **Ropa y accesorios**: zara, h&m, mango, ropa, zapatos, zapatería, complementos, accesorios, bolso, cinturón
- **Coche**: gasolina, repsol, cepsa, taller, mecánico, parking, aparcamiento, peaje, autopista, seguro coche, itv
- **Ocio**: cine, teatro, concierto, museo, parque, ocio, entretenimiento, salir
- **Deporte entrenamiento**: gimnasio, deporte, entrenamiento, fitness, piscina, yoga, pilates, running
- **Trámites**: notaría, gestoría, registro, trámite, hacienda, impuesto, multa, tasa
- **Casa**: ikea, leroy, bricomart, ferretería, muebles, decoración, alquiler, hipoteca, luz, agua, gas, internet
- **Viajes**: hotel, hostal, airbnb, booking, viaje, avión, tren, vueling, renfe
- **Inversión**: inversión, acciones, fondo, bolsa, criptomoneda, ahorro

## Cuentas en Firefly III

### Cuenta Origen
- **Cash**: Cuenta de origen para todos los gastos

### Cuentas Destino
- **Personales**: Gastos personales (por defecto)
- **Estudio**: Gastos profesionales (si el texto menciona "estudio", "trabajo", "oficina" o "profesional")

## Tags

- **Extraordinario**: Se aplica automáticamente si el texto menciona "extraordinario" o "previsto", o si se especifica una fecha futura

## Notas Técnicas

- La IA usa GPT-4o-mini para extraer información del texto
- Si no se especifica fecha, se asume la fecha actual
- Los gastos extraordinarios DEBEN incluir fecha explícita
- La categorización se hace primero por palabras clave, luego por IA si no hay coincidencia
- El sistema es case-insensitive (no distingue mayúsculas/minúsculas)

## Solución de Problemas

### Error: "No se pudo extraer monto y descripción"
- **Causa**: El texto no contiene información suficiente
- **Solución**: Asegúrate de incluir al menos el monto y una descripción. Ejemplo: "25 Mercadona"

### Error: "Los gastos extraordinarios DEBEN incluir fecha"
- **Causa**: Se mencionó "extraordinario" pero no se especificó fecha
- **Solución**: Incluye la fecha. Ejemplo: "500 viaje extraordinario 15 marzo"

### Error: "Firefly III no está configurado"
- **Causa**: Las credenciales de Firefly III no están configuradas
- **Solución**: Verifica que las variables de entorno `FIREFLY_API_TOKEN` y `FIREFLY_BASE_URL` estén configuradas

## Seguridad

- El endpoint es **público** (no requiere autenticación)
- Se recomienda usar HTTPS para proteger los datos en tránsito
- Las credenciales de Firefly III se almacenan de forma segura en variables de entorno del servidor
