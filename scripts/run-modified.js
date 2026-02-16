// ------------------------------------------------------------
// RUN.JS - PIPELINE COMPLETO TIMP → MENSAJES POR ALUMNO
// ------------------------------------------------------------

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const log = {
  ok: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

async function validarEntornoChrome() {

  console.log("🔎 FASE 0 - Validación entorno Chrome\n");

  let browser;

  try {
    browser = await chromium.connectOverCDP("http://localhost:9222");
    log.ok("Conexión Chrome OK");
  } catch (error) {
    log.error("No se pudo conectar a Chrome");
    process.exit(1);
  }

  const contexts = browser.contexts();
  const pages = contexts[0].pages();

  console.log("URL actual:", pages[0].url(), "\n");

  return browser;
}

function ejecutarScript(nombreScript) {
  return new Promise((resolve, reject) => {

    console.log("--------------------------------------------------");
    console.log(`▶️  Ejecutando ${nombreScript}`);
    console.log("--------------------------------------------------\n");

    const proceso = spawn("node", [nombreScript], {
      stdio: "inherit"
    });

    proceso.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${nombreScript} terminó con código ${code}`));
    });

    proceso.on("error", reject);
  });
}

function verificarArchivo(ruta) {

  const rutaCompleta = path.join(__dirname, ruta);

  if (!fs.existsSync(rutaCompleta)) {
    throw new Error(`No existe: ${ruta}`);
  }

  const stats = fs.statSync(rutaCompleta);

  if (stats.size === 0) {
    throw new Error(`Archivo vacío: ${ruta}`);
  }

  log.ok(`Verificado: ${ruta}`);
}

async function main() {

  const browserValidacion = await validarEntornoChrome();

  try {

    // FASE 1
    console.log("\n🔎 FASE 1\n");
    await ejecutarScript("timp-control.js");
    verificarArchivo("data/agenda.json");
    verificarArchivo("data/alumnos.json");

    // FASE 2
    console.log("\n🔎 FASE 2\n");
    await ejecutarScript("timp-horarios-por-nivel.js");
    verificarArchivo("data/horarios_por_nivel.json");

    // FASE 3
    console.log("\n🔎 FASE 3\n");
    await ejecutarScript("cruce-agenda-nivel.js");
    verificarArchivo("data/agenda_enriquecida.json");

    // FASE 4
    console.log("\n🔎 FASE 4\n");
    await ejecutarScript("timp-alumnos-centro.js");
    verificarArchivo("data/alumnos_centro_nivel.json");

    // FASE 5
    console.log("\n🔎 FASE 5\n");
    await ejecutarScript("cruce-alumnos-nivel.js");
    verificarArchivo("data/alumnos_enriquecidos.json");

    // FASE 6
    console.log("\n🔎 FASE 6\n");
    await ejecutarScript("generar_mensajes_por_alumno.js");
    verificarArchivo("data/mensajes_por_alumno.json");

    // FASE 7 - SUBIR AGENDA AL PANEL
    console.log("\n🔎 FASE 7 - Subir agenda al panel\n");
    await ejecutarScript("upload-agenda.js");

    console.log("\n======================================");
    console.log("🎉 PIPELINE COMPLETO FINALIZADO");
    console.log("Archivo final generado:");
    console.log("data/mensajes_por_alumno.json");
    console.log("Agenda subida al panel de control");
    console.log("======================================\n");

  } catch (error) {
    log.error(error.message);
    await browserValidacion.close();
    process.exit(1);
  }

  await browserValidacion.close();
  process.exit(0);
}

main();
