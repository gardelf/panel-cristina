# Panel de Control - Cristina

Panel de control personalizado con widgets para visualizar información financiera y de gestión de clases de pilates en tiempo real.

## Características

### 📊 Widget de Gastos (Firefly III)
- Gastos del mes vigente
- Gastos de la última semana
- Gastos de ayer
- Gastos extraordinarios previstos para el próximo mes
- Actualización automática cada 5 minutos
- Enlace directo a Firefly III

### 💰 Widget de Ingresos (Google Sheets)
- Ingresos a fecha de hoy
- Ingresos pendientes por cobrar
- Ingresos previstos
- Actualización automática cada 5 minutos
- Enlace directo a la hoja de Google Sheets

### 📅 Widget de Clases Vacías
- Visualización de plazas libres por día de la semana
- Total de plazas disponibles
- Enlace al sistema local de gestión (localhost:3000)

## Tecnologías

- **Frontend:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11
- **Base de datos:** MySQL/TiDB
- **Autenticación:** Manus OAuth
- **Integraciones:**
  - Firefly III API (gestión financiera)
  - Google Sheets API pública (contabilidad de ingresos)
  - Sistema local Playwright (gestión de clases)

## Variables de Entorno

Las siguientes variables de entorno están configuradas:

### Firefly III
- `FIREFLY_BASE_URL`: URL de la instancia de Firefly III
- `FIREFLY_API_TOKEN`: Token JWT de acceso personal

### Google Sheets
- `GOOGLE_SHEETS_ID`: ID de la hoja de cálculo de Google Sheets

## Configuración

### 1. Firefly III

1. Accede a tu instancia de Firefly III
2. Ve a **Options → Profile → OAuth → Personal Access Tokens**
3. Crea un nuevo token con permisos completos
4. Copia el token y configúralo en las variables de entorno

### 2. Google Sheets

1. Asegúrate de que tu hoja de Google Sheets sea pública (con acceso de lectura)
2. Extrae el ID de la URL de la hoja (la parte entre `/d/` y `/edit`)
3. Configúralo en las variables de entorno

**Nota:** La lógica de cálculo de ingresos debe ajustarse según la estructura específica de tu hoja de Google Sheets. Actualmente suma todas las celdas de las primeras 3 columnas.

### 3. Sistema Local de Clases

El widget de clases vacías está preparado para conectarse con un servidor local en `http://localhost:3000`. Cuando el servidor esté disponible, se puede integrar mediante una API REST o WebSocket.

## Despliegue en Railway

### Opción 1: Desde la interfaz de Manus

1. Guarda un checkpoint del proyecto
2. Haz clic en el botón "Publish" en la interfaz de Manus
3. Sigue las instrucciones para desplegar

### Opción 2: Integración con GitHub

1. Exporta el código a un repositorio de GitHub desde la interfaz de Manus
2. En Railway, crea un nuevo proyecto
3. Conecta el repositorio de GitHub
4. Configura las variables de entorno necesarias
5. Despliega

## Estructura del Proyecto

```
panel-cristina/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   │   ├── Widget.tsx           # Componente base de widget
│   │   │   ├── ExpensesWidget.tsx   # Widget de gastos
│   │   │   └── IncomeWidget.tsx     # Widget de ingresos
│   │   ├── pages/         # Páginas de la aplicación
│   │   │   └── Dashboard.tsx        # Panel principal
│   │   └── lib/           # Utilidades
│   └── public/            # Archivos estáticos
├── server/                # Backend Express + tRPC
│   ├── firefly.ts         # Servicio de Firefly III
│   ├── googleSheets.ts    # Servicio de Google Sheets
│   ├── routers.ts         # Rutas tRPC
│   └── _core/             # Configuración del servidor
├── drizzle/               # Esquemas de base de datos
└── shared/                # Código compartido
```

## Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Ejecutar tests
pnpm test

# Compilar para producción
pnpm build

# Iniciar en producción
pnpm start
```

## Personalización

### Ajustar cálculos de Google Sheets

Edita el archivo `server/googleSheets.ts` en el método `calculateIncome()` para adaptar la lógica a la estructura de tu hoja:

```typescript
async calculateIncome(): Promise<{
  currentIncome: number;
  pendingIncome: number;
  projectedIncome: number;
}> {
  const data = await this.getSheetData();
  
  // Ajusta esta lógica según tu estructura
  // Ejemplo: si los ingresos están en la columna B
  // y los pendientes en la columna C
  
  return {
    currentIncome: // tu cálculo,
    pendingIncome: // tu cálculo,
    projectedIncome: // tu cálculo,
  };
}
```

### Integrar sistema local de clases

Para conectar el widget de clases vacías con tu sistema local:

1. Crea un endpoint en tu servidor local que devuelva los datos de clases
2. Agrega un procedimiento tRPC en `server/routers.ts`
3. Crea un componente `ClassesWidget.tsx` similar a `ExpensesWidget.tsx`
4. Actualiza `Dashboard.tsx` para usar el nuevo componente

## Soporte

Para cualquier problema o pregunta sobre el panel, contacta con el equipo de desarrollo.

## Licencia

MIT
