import { getPersonalCalendarEvents } from "./icloudCalendar";

async function main() {
  console.log("🔍 Buscando evento 'Peritar daños Toyota'...\n");

  const startDate = "1990-01-01T00:00:00Z";
  const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const events = await getPersonalCalendarEvents(startDate, endDate);

  console.log(`Total de eventos obtenidos: ${events.length}\n`);

  const toyotaEvents = events.filter(e => 
    e.title.toLowerCase().includes("toyota") || 
    e.title.toLowerCase().includes("peritar")
  );

  console.log(`Eventos relacionados con Toyota: ${toyotaEvents.length}\n`);
  console.log("=".repeat(80));

  toyotaEvents.forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.title}`);
    console.log(`   ID: ${event.id}`);
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
