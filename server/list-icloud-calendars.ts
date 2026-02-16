import { createDAVClient } from "tsdav";

async function main() {
  console.log("📅 Conectando a iCloud Calendar...\n");

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

    console.log(`Total de calendarios encontrados: ${calendars.length}\n`);
    console.log("=".repeat(80));

    calendars.forEach((calendar, index) => {
      console.log(`\n${index + 1}. ${calendar.displayName || "Sin nombre"}`);
      console.log(`   URL: ${calendar.url}`);
      console.log(`   Descripción: ${calendar.description || "Sin descripción"}`);
      console.log(`   Color: ${calendar.calendarColor || "No especificado"}`);
      console.log(`   Timezone: ${calendar.timezone || "No especificado"}`);
      console.log(`   Tipo: ${calendar.components?.join(", ") || "No especificado"}`);
      console.log("   " + "-".repeat(76));
    });

    console.log("\n" + "=".repeat(80));
  } catch (error) {
    console.error("❌ Error al conectar con iCloud:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
