import { createDAVClient } from "tsdav";

async function main() {
  console.log("📅 Obteniendo eventos de HOY de iCloud Calendar...\n");

  const email = process.env.ICLOUD_EMAIL;
  const password = process.env.ICLOUD_APP_PASSWORD;

  if (!email || !password) {
    console.error("❌ Credenciales de iCloud no configuradas");
    process.exit(1);
  }

  try {
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

    console.log("✅ Conectado a iCloud\n");

    // Obtener calendarios disponibles
    const calendars = await client.fetchCalendars();

    // Definir rango de hoy (00:00 a 23:59)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`📆 Fecha de hoy: ${today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`);
    console.log("=".repeat(80));

    let totalEvents = 0;

    for (const calendar of calendars) {
      // Saltar calendarios de tipo VTODO (recordatorios/tareas)
      if (calendar.components?.includes("VTODO")) {
        continue;
      }

      try {
        console.log(`\n📋 Calendario: ${calendar.displayName || "Sin nombre"}`);
        console.log(`   Color: ${calendar.calendarColor || "No especificado"}`);
        console.log("   " + "-".repeat(76));

        const calendarObjects = await client.fetchCalendarObjects({
          calendar: calendar,
          timeRange: {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString(),
          },
        });

        if (calendarObjects.length === 0) {
          console.log("   ℹ️  No hay eventos para hoy\n");
          continue;
        }

        console.log(`   ✅ ${calendarObjects.length} evento(s) encontrado(s):\n`);

        calendarObjects.forEach((obj, index) => {
          if (!obj.data) return;

          const event = parseICalEvent(obj.data);
          if (event) {
            totalEvents++;
            console.log(`   ${index + 1}. ${event.title}`);
            console.log(`      Inicio: ${event.start}`);
            console.log(`      Fin: ${event.end}`);
            console.log(`      Todo el día: ${event.allDay ? "Sí" : "No"}`);
            if (event.description) {
              console.log(`      Descripción: ${event.description}`);
            }
            if (event.location) {
              console.log(`      Ubicación: ${event.location}`);
            }
            console.log("");
          }
        });

      } catch (error) {
        console.log(`   ❌ Error al obtener eventos: ${error}`);
      }
    }

    console.log("=".repeat(80));
    console.log(`\n📊 Total de eventos para hoy: ${totalEvents}\n`);

  } catch (error) {
    console.error("❌ Error al conectar con iCloud:", error);
    process.exit(1);
  }
}

function parseICalEvent(icalData: string): any {
  try {
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
        const dateStr = trimmed.substring(19).trim();
        start = formatICalDate(dateStr, true);
        allDay = true;
      } else if (trimmed.startsWith("DTSTART:")) {
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
        location = trimmed.substring(9).trim().replace(/\\,/g, ',');
      }
    }

    if (!title || !start) {
      return null;
    }

    if (!end) {
      end = start;
    }

    return {
      title,
      start,
      end,
      allDay,
      description,
      location,
    };
  } catch (error) {
    return null;
  }
}

function formatICalDate(icalDate: string, isAllDay: boolean): string {
  try {
    if (isAllDay) {
      const year = icalDate.substring(0, 4);
      const month = icalDate.substring(4, 6);
      const day = icalDate.substring(6, 8);
      return `${year}-${month}-${day}`;
    } else {
      const year = icalDate.substring(0, 4);
      const month = icalDate.substring(4, 6);
      const day = icalDate.substring(6, 8);
      const hour = icalDate.substring(9, 11);
      const minute = icalDate.substring(11, 13);
      const second = icalDate.substring(13, 15);
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
  } catch (error) {
    return new Date().toISOString();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
