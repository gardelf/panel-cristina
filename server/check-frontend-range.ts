import { getPersonalCalendarEvents } from "./icloudCalendar";

async function main() {
  // Mismo rango que usa el frontend (desde las 00:00 de hoy)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const startDate = todayStart.toISOString();
  const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`📅 Rango de consulta:`);
  console.log(`   Desde: ${startDate}`);
  console.log(`   Hasta: ${endDate}`);
  console.log();

  const events = await getPersonalCalendarEvents(startDate, endDate);
  
  console.log(`📊 Total de eventos obtenidos: ${events.length}`);
  console.log();

  // Filtrar eventos de hoy (16 de febrero de 2026)
  const todayStr = new Date().toISOString().split('T')[0]; // 2026-02-16
  const todayEvents = events.filter(e => e.start.startsWith(todayStr));

  console.log(`📆 Eventos de hoy (${todayStr}): ${todayEvents.length}`);
  console.log();

  if (todayEvents.length > 0) {
    todayEvents.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Inicio: ${event.start}`);
      console.log(`   Fin: ${event.end}`);
      console.log(`   Todo el día: ${event.allDay}`);
      console.log();
    });
  } else {
    console.log("❌ No se encontraron eventos para hoy");
    console.log();
    console.log("Primeros 5 eventos del rango:");
    events.slice(0, 5).forEach((event, i) => {
      console.log(`${i + 1}. ${event.title} - ${event.start}`);
    });
  }
}

main().catch(console.error);
