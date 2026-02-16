import { getDb } from "./db";
import { agenda } from "../drizzle/schema";
import { desc } from "drizzle-orm";

async function main() {
  console.log("📅 Verificando datos de clases...\n");

  const db = await getDb();
  if (!db) {
    console.log("❌ Base de datos no disponible");
    return;
  }

  const latest = await db
    .select()
    .from(agenda)
    .orderBy(desc(agenda.uploadedAt))
    .limit(1);

  if (latest.length === 0) {
    console.log("❌ No hay datos de clases en la base de datos");
    return;
  }

  const data = JSON.parse(latest[0].data);
  
  console.log("✅ Datos encontrados");
  console.log(`   Tipo de datos: ${typeof data}`);
  console.log(`   Es array: ${Array.isArray(data)}`);
  
  if (Array.isArray(data)) {
    console.log(`   Total de clases: ${data.length}\n`);
    
    // Mostrar primeras 3 clases
    console.log("Primeras 3 clases:");
    data.slice(0, 3).forEach((clase: any, i: number) => {
      console.log(`\n${i + 1}. Fecha: ${clase.fecha}, Hora: ${clase.hora}`);
      console.log(`   Reservas: ${clase.reservas}`);
      console.log(`   Libres: ${clase.libres}`);
      console.log(`   Aforo: ${clase.aforo}`);
      
      if (typeof clase.reservas === 'number' && typeof clase.aforo === 'number') {
        const valor = clase.reservas * 15;
        console.log(`   Valor: ${valor}€`);
        console.log(`   Título esperado: "${clase.reservas}/${clase.aforo} - ${valor}€"`);
      } else {
        console.log(`   ⚠️  reservas o aforo no son números`);
        console.log(`   reservas tipo: ${typeof clase.reservas}, valor: ${clase.reservas}`);
        console.log(`   aforo tipo: ${typeof clase.aforo}, valor: ${clase.aforo}`);
      }
    });
  } else {
    console.log("❌ Los datos no son un array");
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
  }
}

main().catch(console.error);
