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
