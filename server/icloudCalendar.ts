import { createDAVClient } from "tsdav";

/**
 * Servicio para sincronizar eventos del calendario personal de iCloud
 * Usa CalDAV para conectarse a iCloud Calendar
 */

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  allDay: boolean;
  description?: string;
  location?: string;
}

/**
 * Obtiene eventos del calendario personal de iCloud
 * @param startDate Fecha de inicio del rango (ISO 8601)
 * @param endDate Fecha de fin del rango (ISO 8601)
 * @returns Lista de eventos del calendario personal
 */
export async function getPersonalCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  try {
    const email = process.env.ICLOUD_EMAIL;
    const password = process.env.ICLOUD_APP_PASSWORD;

    if (!email || !password) {
      console.error("[iCloud Calendar] Credenciales no configuradas");
      return [];
    }

    // Crear cliente CalDAV
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: {
        username: email,
        password: password,
      },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    // Obtener calendarios disponibles
    const calendars = await client.fetchCalendars();

    if (!calendars || calendars.length === 0) {
      console.log("[iCloud Calendar] No se encontraron calendarios");
      return [];
    }

    // Obtener eventos de todos los calendarios
    const allEvents: CalendarEvent[] = [];

    // Ampliar el rango de fechas para capturar eventos recurrentes con fechas antiguas
    // Usar un rango muy amplio (desde 1990 hasta endDate) para capturar todos los eventos
    const expandedStartDate = "1990-01-01T00:00:00Z";

    for (const calendar of calendars) {
      // Saltar calendarios de tipo VTODO (recordatorios/tareas)
      if (calendar.components?.includes("VTODO")) {
        continue;
      }

      try {
        const calendarObjects = await client.fetchCalendarObjects({
          calendar: calendar,
          timeRange: {
            start: expandedStartDate,
            end: endDate,
          },
        });

        // Parsear eventos de iCal format
        for (const obj of calendarObjects) {
          if (!obj.data) continue;

          const event = parseICalEvent(obj.data, obj.url || "");
          if (event) {
            // Filtrar eventos para mostrar solo los del rango solicitado
            // Esto permite capturar eventos con fechas antiguas pero que son recurrentes
            const eventStart = new Date(event.start);
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            
            // Incluir evento si:
            // 1. Está dentro del rango solicitado, O
            // 2. Tiene fecha antigua (antes de 2020) - probablemente recurrente
            if (
              (eventStart >= rangeStart && eventStart <= rangeEnd) ||
              eventStart.getFullYear() < 2020
            ) {
              allEvents.push(event);
            }
          }
        }
      } catch (error) {
        console.error(
          `[iCloud Calendar] Error al obtener eventos del calendario ${calendar.displayName}:`,
          error
        );
      }
    }

    console.log(
      `[iCloud Calendar] Obtenidos ${allEvents.length} eventos personales`
    );
    return allEvents;
  } catch (error) {
    console.error("[iCloud Calendar] Error al conectar con iCloud:", error);
    return [];
  }
}

/**
 * Parsea un evento en formato iCal a nuestro formato
 */
function parseICalEvent(icalData: string, eventId: string): CalendarEvent | null {
  try {
    // Extraer campos básicos del formato iCal
    const lines = icalData.split("\n");
    let title = "";
    let start = "";
    let end = "";
    let allDay = false;
    let description = "";
    let location = "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("SUMMARY:")) {
        title = trimmed.substring(8).trim();
      } else if (trimmed.startsWith("DTSTART;VALUE=DATE:")) {
        // Evento de día completo
        const dateStr = trimmed.substring(19).trim();
        start = formatICalDate(dateStr, true);
        allDay = true;
      } else if (trimmed.startsWith("DTSTART:")) {
        // Evento con hora específica
        const dateStr = trimmed.substring(8).trim();
        start = formatICalDate(dateStr, false);
      } else if (trimmed.startsWith("DTEND;VALUE=DATE:")) {
        const dateStr = trimmed.substring(17).trim();
        end = formatICalDate(dateStr, true);
        allDay = true;
      } else if (trimmed.startsWith("DTEND:")) {
        const dateStr = trimmed.substring(6).trim();
        end = formatICalDate(dateStr, false);
      } else if (trimmed.startsWith("DESCRIPTION:")) {
        description = trimmed.substring(12).trim();
      } else if (trimmed.startsWith("LOCATION:")) {
        location = trimmed.substring(9).trim();
      }
    }

    if (!title || !start) {
      return null;
    }

    // Si no hay fecha de fin, usar la misma que la de inicio
    if (!end) {
      end = start;
    }

    return {
      id: eventId,
      title,
      start,
      end,
      allDay,
      description,
      location,
    };
  } catch (error) {
    console.error("[iCloud Calendar] Error al parsear evento:", error);
    return null;
  }
}

/**
 * Convierte fecha iCal a formato ISO 8601
 * @param icalDate Fecha en formato iCal (ej: 20260216T100000Z o 20260216)
 * @param isAllDay Si es un evento de día completo
 */
function formatICalDate(icalDate: string, isAllDay: boolean): string {
  try {
    if (isAllDay) {
      // Formato: 20260216 -> 2026-02-16
      const year = icalDate.substring(0, 4);
      const month = icalDate.substring(4, 6);
      const day = icalDate.substring(6, 8);
      return `${year}-${month}-${day}`;
    } else {
      // Formato: 20260216T100000Z -> 2026-02-16T10:00:00Z
      const year = icalDate.substring(0, 4);
      const month = icalDate.substring(4, 6);
      const day = icalDate.substring(6, 8);
      const hour = icalDate.substring(9, 11);
      const minute = icalDate.substring(11, 13);
      const second = icalDate.substring(13, 15);
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
  } catch (error) {
    console.error("[iCloud Calendar] Error al formatear fecha:", error);
    return new Date().toISOString();
  }
}
