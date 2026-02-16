import { describe, it, expect } from "vitest";
import { getPersonalCalendarEvents } from "./icloudCalendar";

describe("iCloud Calendar Integration", () => {
  it("should connect to iCloud and fetch calendar events", async () => {
    // Obtener eventos de los próximos 30 días
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const events = await getPersonalCalendarEvents(startDate, endDate);

    // Verificar que la conexión funciona (puede devolver array vacío si no hay eventos)
    expect(Array.isArray(events)).toBe(true);
    
    console.log(`✅ iCloud Calendar: Obtenidos ${events.length} eventos personales`);
    
    if (events.length > 0) {
      console.log("Primer evento:", events[0]);
      
      // Verificar estructura de eventos
      expect(events[0]).toHaveProperty("id");
      expect(events[0]).toHaveProperty("title");
      expect(events[0]).toHaveProperty("start");
      expect(events[0]).toHaveProperty("end");
      expect(events[0]).toHaveProperty("allDay");
    }
  }, 30000); // Timeout de 30 segundos para conexión a iCloud
});
