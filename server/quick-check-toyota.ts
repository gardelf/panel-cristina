import { getPersonalCalendarEvents } from "./icloudCalendar";

async function main() {
  const startDate = "1990-01-01T00:00:00Z";
  const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const events = await getPersonalCalendarEvents(startDate, endDate);
  
  const toyotaEvent = events.find(e => e.title.includes("Peritar"));
  
  if (toyotaEvent) {
    console.log("✅ Evento encontrado:");
    console.log(JSON.stringify(toyotaEvent, null, 2));
  } else {
    console.log("❌ Evento no encontrado");
  }
}

main().catch(console.error);
