import { getPersonalCalendarEvents } from "./icloudCalendar";

async function main() {
  console.log("📅 Obteniendo eventos de iCloud Calendar...\n");

  // Obtener eventos de los próximos 60 días
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const events = await getPersonalCalendarEvents(startDate, endDate);

  console.log(`Total de eventos encontrados: ${events.length}\n`);
  console.log("=".repeat(80));

  events.forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.title}`);
    console.log(`   Fecha inicio: ${event.start}`);
    console.log(`   Fecha fin: ${event.end}`);
    console.log(`   Todo el día: ${event.allDay ? "Sí" : "No"}`);
    if (event.description) {
      console.log(`   Descripción: ${event.description}`);
    }
    if (event.location) {
      console.log(`   Ubicación: ${event.location}`);
    }
    console.log("   " + "-".repeat(76));
  });

  console.log("\n" + "=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
