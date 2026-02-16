# Panel de Control - Cristina - TODO

## Diseño y Estructura Base
- [x] Configurar sistema de diseño elegante y profesional (colores, tipografía, espaciado)
- [x] Implementar tema visual limpio con Tailwind CSS 4
- [x] Crear layout principal del dashboard con sistema de grid para widgets
- [x] Diseñar componentes de widget reutilizables
- [x] Implementar diseño responsive para diferentes dispositivos

## Widget de Gastos (Firefly III)
- [x] Crear esquema de base de datos para cachear datos de Firefly III
- [x] Implementar servicio de integración con API de Firefly III
- [x] Crear procedimiento tRPC para obtener gastos del mes vigente
- [x] Crear procedimiento tRPC para obtener gastos de la última semana
- [x] Crear procedimiento tRPC para obtener gastos de ayer
- [x] Crear procedimiento tRPC para obtener gastos extraordinarios previstos
- [x] Diseñar componente UI del widget de gastos con visualización de datos
- [x] Implementar sistema de configuración para token de Firefly III
- [x] Agregar manejo de errores y estados de carga

## Widget de Ingresos (Google Sheets)
- [x] Implementar servicio de integración con Google Sheets API pública
- [x] Crear procedimiento tRPC para extraer datos de ingresos
- [x] Calcular ingresos a fecha de hoy
- [x] Calcular ingresos pendientes por cobrar
- [x] Calcular ingresos previstos
- [x] Diseñar componente UI del widget de ingresos
- [x] Agregar botón de acceso directo a la hoja de Google Sheets
- [x] Implementar actualización automática de datos
- [ ] Ajustar lógica de cálculo según estructura real de la hoja

## Widget de Clases Vacías
- [x] Crear esquema de base de datos para información de clases
- [x] Diseñar componente UI del widget de clases vacías
- [x] Mostrar plazas libres en horarios de pilates de la semana
- [x] Agregar botón de acceso al servidor local (localhost:3000)
- [x] Implementar visualización de horarios con plazas disponibles
- [ ] Integrar con API del servidor local cuando esté disponible

## Sistema de Autenticación
- [x] Configurar autenticación con Manus OAuth
- [x] Proteger rutas del dashboard con autenticación
- [x] Implementar página de login elegante
- [x] Agregar manejo de sesiones y logout
- [x] Configurar roles de usuario (admin para Cristina)

## Integración y Despliegue
- [x] Configurar variables de entorno para tokens y URLs
- [x] Preparar configuración para Railway
- [ ] Configurar integración con GitHub
- [ ] Crear documentación de configuración
- [x] Realizar pruebas de integración
- [ ] Crear checkpoint final para despliegue

## Testing
- [x] Escribir tests unitarios para servicios de integración
- [x] Escribir tests para procedimientos tRPC
- [ ] Realizar pruebas de UI en diferentes dispositivos
- [x] Validar manejo de errores y estados edge case

## Ajustes Pendientes
- [x] Ajustar integración de Google Sheets para leer pestaña "pagos" columna E
- [x] Implementar cálculo de pendientes: (columna W pestaña clientes) - (columna E pestaña pagos)
- [x] Implementar cálculo de previstos: suma columna W pestaña clientes

## Integración Widget de Clases Vacías
- [x] Crear servidor Express local para exponer datos de clases
- [x] Implementar endpoint GET /api/clases-vacias
- [x] Actualizar widget de clases para consumir API local
- [x] Documentar instalación y uso del servidor local

## Widget de Clases con Iframe
- [x] Modificar ClassesWidget para mostrar iframe de localhost:3000
- [x] Hacer iframe completamente interactivo
- [x] Ajustar tamaño y diseño del iframe

## Servidor Local con Interfaz Web
- [ ] Crear interfaz HTML para servidor Express local
- [ ] Mostrar clases vacías en formato visual (tablas/tarjetas)
- [ ] Actualizar servidor-clases-local.js con ruta raíz que sirva HTML

## Integración Panel de Envío de Alumnos
- [ ] Crear widget con lista de alumnos y checkboxes
- [ ] Implementar botón "Generar" que ejecute run.js
- [ ] Implementar botón "Seleccionar/Deseleccionar todos"
- [ ] Implementar botón "Guardar selección"
- [ ] Implementar botón "Enviar" que ejecute envio_push_timp.js
- [ ] Crear procedimientos tRPC para comunicación con API local
- [ ] Agregar barra de progreso para operaciones largas
- [ ] Configurar servidor local con HTTPS para iframe (Solución A)

## Sistema de Calendario de Clases con Subida Automática
- [x] Crear tabla en base de datos para almacenar datos de agenda.json
- [x] Crear endpoint POST /api/agenda para recibir agenda.json desde Playwright
- [x] Crear procedimiento tRPC para obtener datos de agenda
- [x] Crear widget de calendario que muestre clases por hora
- [x] Proporcionar código para modificar script de Playwright y subir datos automáticamente

## Restaurar Widget con Iframe
- [x] Agregar ClassesWidget (iframe localhost:3000) junto al CalendarWidget

## Bugs a Corregir
- [x] Corregir error en CalendarWidget que causa crash

## Mejoras al Calendario
- [x] Mostrar estructura de horarios completa de 8:00 a 21:00 aunque no haya clases

## Bugs Urgentes
- [x] Las clases no se muestran en el calendario (problema de coincidencia de fechas/horas)

## Implementar FullCalendar
- [x] Instalar librerías de FullCalendar
- [x] Crear nuevo componente CalendarWidget con FullCalendar
- [x] Integrar datos de agenda con formato de eventos
- [x] Configurar vista semanal de 8:00 a 21:00
- [x] Agregar colores según disponibilidad de plazas

## Mejoras FullCalendar
- [x] Calendario debe mostrar automáticamente la semana que tiene clases (no la semana actual)

## Mejoras Visuales Calendario
- [x] Hacer más visibles las líneas de separación entre horas en el calendario

## Integración Atajo iPhone - Firefly III
- [ ] Crear endpoint REST para recibir datos de transacciones desde atajo de iPhone
- [ ] Integrar con API de Firefly III para crear gastos
- [ ] Probar endpoint con datos de prueba
- [ ] Crear instrucciones para configurar atajo de iPhone con entrada por voz

## Bug Multi-tenancy Firefly III
- [ ] Modificar código para trabajar con multi-tenancy activado en Firefly III

## Mejoras Económicas Calendario
- [x] Mostrar valor económico (15€ × plazas ocupadas) en cada clase del calendario
- [x] Cambiar "Plazas libres" por valor económico potencial (15€ × plazas libres totales)

## Bug Gastos Extraordinarios
- [x] Gastos con etiqueta "extraordinario" para próximo mes no se muestran en el panel
- [x] Revisar criterio de detección de gastos extraordinarios

## Gastos del Estudio
- [x] Crear método para obtener gastos de la cuenta "Estudio"
- [x] Agregar procedimiento tRPC para gastos del Estudio con lista detallada
- [x] Actualizar ExpensesWidget con sección desplegable de gastos del Estudio

## Reorganización Widget Gastos
- [x] Mover sección "Gastos del Estudio" para que aparezca antes de los gastos personales

## Bug Filtro Gastos del Estudio
- [x] Cambiar filtro de gastos del Estudio para usar cuenta de destino (destination_name) en lugar de cuenta de origen (source_name)

## Filtrar Gastos Personales
- [x] Modificar métodos de gastos personales (Este mes, Última semana, Ayer) para filtrar solo cuenta de destino "Personal"

## Secciones Desplegables en Widget de Gastos
- [x] Hacer desplegable la sección "Ayer" para mostrar lista de transacciones
- [x] Hacer desplegable la sección "Gastos extraordinarios previstos" para mostrar lista de transacciones

## Cálculos de Márgenes
- [x] Agregar sección "Margen Estudio" a la derecha de "Gastos del Estudio" (Ingresos previstos - Gastos Estudio)
- [x] Agregar sección "Margen Personal" al lado de "Gastos extraordinarios" (Margen Estudio - Gastos personales mes)

## Endpoint para Atajo de iPhone
- [x] Crear método createTransaction en FireflyService para enviar gastos a Firefly III API
- [x] Crear endpoint tRPC expenses.create para recibir datos del iPhone
- [x] Crear documentación con instrucciones para configurar atajo de iPhone
- [x] Probar endpoint con datos de ejemplo

## Corregir Distribución de Widgets
- [x] Revisar distribución actual de widgets en Home.tsx
- [x] Restaurar diseño inicial con distribución correcta

## Corregir Carga de Datos del Calendario
- [x] Investigar por qué no se cargan datos de data/agenda.json
- [x] Verificar endpoint trpc.agenda.getLatest
- [x] Buscar y analizar run.js
- [x] Integrar ejecución automática de upload-agenda.js en run.js

## Integrar Calendario Personal de iPhone
- [x] Configurar credenciales de iCloud en variables de entorno
- [x] Instalar biblioteca tsdav para CalDAV
- [x] Crear servicio icloudCalendar.ts
- [x] Crear endpoint tRPC para eventos personales
- [x] Actualizar CalendarWidget para combinar ambos calendarios
- [x] Probar sincronización con iCloud

## Corregir Filtrado de Eventos de iCloud
- [x] Modificar getPersonalCalendarEvents para capturar eventos recurrentes
- [x] Ajustar parseo de eventos para manejar fechas incorrectas
- [x] Probar que eventos de hoy aparezcan en el calendario del panel

## Diagnosticar Evento "Peritar daños Toyota" No Visible
- [x] Verificar qué eventos se están enviando al frontend
- [x] Revisar filtrado en CalendarWidget
- [x] Corregir problema de visualización (ajustado rango de fechas en frontend)
- [x] Modificar CalendarWidget para mostrar eventos antiguos en fecha de hoy
- [x] Verificar que el evento aparece en el calendario del panel

## Corregir Hora del Evento "Peritar daños Toyota"
- [x] Investigar datos raw de iCloud para el evento
- [x] Identificar cómo obtener la hora correcta (9:30-10:30)
- [x] Implementar solución para eventos con zona horaria (TZID)
- [x] Verificar que muestra 9:30-10:30 en el calendario

## Corregir Filtrado de Eventos Antiguos
- [x] Analizar qué eventos se están mostrando incorrectamente en el calendario
- [x] Eliminar lógica que reubica todos los eventos antiguos a hoy
- [x] Implementar filtrado para excluir eventos con fechas antes de 2020
- [x] Verificar que solo "Peritar daños Toyota" aparece para hoy 16/02/2026
