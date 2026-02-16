import { createDAVClient } from "tsdav";

async function main() {
  console.log("🔍 Inspeccionando datos RAW del evento 'Peritar daños Toyota'...\n");

  const email = process.env.ICLOUD_EMAIL;
  const password = process.env.ICLOUD_APP_PASSWORD;

  if (!email || !password) {
    console.error("❌ Credenciales de iCloud no configuradas");
    process.exit(1);
  }

  try {
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

    const calendars = await client.fetchCalendars();
    const startDate = "1990-01-01T00:00:00Z";
    const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    for (const calendar of calendars) {
      if (calendar.components?.includes("VTODO")) {
        continue;
      }

      try {
        const calendarObjects = await client.fetchCalendarObjects({
          calendar: calendar,
          timeRange: {
            start: startDate,
            end: endDate,
          },
        });

        for (const obj of calendarObjects) {
          if (!obj.data) continue;

          if (obj.data.includes("Peritar") || obj.data.includes("Toyota")) {
            console.log("=".repeat(80));
            console.log(`📋 Calendario: ${calendar.displayName}`);
            console.log("=".repeat(80));
            console.log("\n📄 DATOS RAW (iCalendar format):\n");
            console.log(obj.data);
            console.log("\n" + "=".repeat(80));
            console.log("\n");
          }
        }
      } catch (error) {
        // Ignorar errores de calendarios individuales
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
