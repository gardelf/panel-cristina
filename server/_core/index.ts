import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // REST endpoint para subir agenda (fuera de tRPC para simplicidad)
  app.post("/api/agenda/upload", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { agenda } = await import("../../drizzle/schema");
      
      const agendaData = req.body;
      
      if (!agendaData || (Array.isArray(agendaData) && agendaData.length === 0)) {
        return res.status(400).json({ error: "No se recibieron datos" });
      }
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Base de datos no disponible" });
      }
      
      await db.insert(agenda).values({
        data: JSON.stringify(agendaData),
      });
      
      console.log(`[Agenda] Subida exitosa: ${Array.isArray(agendaData) ? agendaData.length : 'N/A'} clases`);
      
      res.json({
        success: true,
        message: "Agenda subida correctamente",
        count: Array.isArray(agendaData) ? agendaData.length : null,
      });
    } catch (error: any) {
      console.error("[Agenda] Error al subir:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // REST endpoint para crear gastos desde atajo de iPhone
  app.post("/api/expenses/create", async (req, res) => {
    try {
      const { description, amount, category, date } = req.body;
      
      if (!description || !amount) {
        return res.status(400).json({ error: "Faltan campos obligatorios: description, amount" });
      }
      
      // Importar servicio de Firefly III
      const { getFireflyService } = await import("../firefly");
      const fireflyService = getFireflyService();
      
      const result = await fireflyService.createExpense({
        description,
        amount: parseFloat(amount),
        category: category || "Sin categoría",
        date: date || new Date().toISOString().split('T')[0],
      });
      
      console.log(`[Expenses] Gasto creado: ${description} - €${amount}`);
      
      res.json({
        success: true,
        message: "Gasto registrado correctamente",
        transaction: result,
      });
    } catch (error: any) {
      console.error("[Expenses] Error al crear gasto:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ─── Diagnóstico temporal ─────────────────────────────────────────────────
  app.get("/debug-env", (_req, res) => {
    res.json({
      hasForgeApiKey: !!process.env.BUILT_IN_FORGE_API_KEY,
      forgeApiKeyLength: (process.env.BUILT_IN_FORGE_API_KEY || "").length,
      hasForgeApiUrl: !!process.env.BUILT_IN_FORGE_API_URL,
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "(vacío)",
      hasOpenAI: !!process.env.OPENAI_API_KEY,
    });
  });

  // ─── Endpoint para atajo de iPhone ─────────────────────────────────────────
  // POST /registrar-gasto — recibe { texto } y devuelve { success: "..." }
  app.post("/registrar-gasto", async (req, res) => {
    try {
      const { texto } = req.body;
      if (!texto) {
        return res.status(400).json({ success: "Error: falta el campo 'texto'" });
      }
      const { getFireflyService } = await import("../firefly");
      const { extraerDatosConIA, categorizarGasto } = await import("../expenseAI");
      const firefly = getFireflyService();
      if (!firefly.isEnabled()) {
        return res.status(500).json({ success: "Error: Firefly III no configurado" });
      }
      console.log("[registrar-gasto] Procesando:", texto);
      const extracted = await extraerDatosConIA(texto);
      if (!extracted.monto || !extracted.descripcion) {
        return res.status(400).json({ success: "No se pudo extraer monto y descripción del texto. Formato: '25 Mercadona'" });
      }
      if (extracted.tags.includes("Extraordinario") && !extracted.fecha) {
        return res.status(400).json({ success: "Los gastos extraordinarios DEBEN incluir fecha. Ejemplo: '500 viaje extraordinario 15 marzo'" });
      }
      let categoria = extracted.categoria;
      let metodo = "ai";
      if (!categoria || categoria === "Otros") {
        const result = categorizarGasto(extracted.descripcion);
        categoria = result.categoria;
        metodo = result.metodo;
      }
      const descripcionLower = extracted.descripcion.toLowerCase();
      const esEstudio = descripcionLower.includes("estudio") ||
                        descripcionLower.includes("trabajo") ||
                        descripcionLower.includes("oficina") ||
                        descripcionLower.includes("profesional");
      const cuentaDestino = esEstudio ? "Estudio" : "Personales";
      const tags = extracted.tags.includes("Extraordinario") ? ["Extraordinario"] : [];
      const result = await firefly.createTransaction({
        description: extracted.descripcion,
        amount: extracted.monto,
        date: extracted.fecha || undefined,
        category: categoria,
        sourceAccount: "Cash",
        destinationAccount: cuentaDestino,
        tags,
      });
      if (!result.success) {
        throw new Error(result.error || "Error al crear transacción");
      }
      const mensaje = `✅ Registrado: ${extracted.monto}€ en ${categoria} (${cuentaDestino})${
        extracted.fecha ? ` - Fecha: ${extracted.fecha}` : ""
      }${
        tags.length > 0 ? ` - Tags: ${tags.join(", ")}` : ""
      }`;
      console.log("[registrar-gasto] OK:", mensaje);
      res.json({ success: mensaje });
    } catch (error: any) {
      console.error("[registrar-gasto] Error:", error);
      res.status(500).json({ success: `Error: ${error.message}` });
    }
  });

  // ─── JotForm endpoints ────────────────────────────────────────────────────
  const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || "566c8a6ccae10b66bcabf52c26315828";
  const JOTFORM_FORM_ID = "252823884959375";
  const JOTFORM_BASE = "https://eu-api.jotform.com";

  // GET /api/jotform/submissions
  app.get("/api/jotform/submissions", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { jotformState } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const url = `${JOTFORM_BASE}/form/${JOTFORM_FORM_ID}/submissions?apiKey=${JOTFORM_API_KEY}&limit=50&orderby=created_at&direction=DESC`;
      const resp = await fetch(url);
      const json = await resp.json() as any;
      const submissions: any[] = json.content || [];
      const db = await getDb();
      let lastSeenAt = "2000-01-01 00:00:00";
      if (db) {
        const rows = await db.select().from(jotformState).where(eq(jotformState.formId, JOTFORM_FORM_ID)).limit(1);
        if (rows.length > 0) lastSeenAt = rows[0].lastSeenAt;
      }
      const newCount = submissions.filter(s => s.created_at > lastSeenAt).length;
      const mapped = submissions.map(s => {
        const a = s.answers || {};
        return {
          id: s.id,
          createdAt: s.created_at,
          nombre: a["2"]?.answer || "",
          apellidos: a["3"]?.answer || "",
          email: a["7"]?.answer || "",
          telefono: a["8"]?.answer || "",
          genero: a["24"]?.answer || "",
          localidad: a["12"]?.answer || "",
          comoNosConocio: a["27"]?.answer || "",
          urlTimp: a["51"]?.answer || a["50"]?.answer || "",
          isNew: s.created_at > lastSeenAt,
        };
      });
      res.json({ submissions: mapped, newCount, lastSeenAt });
    } catch (error: any) {
      console.error("[JotForm] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/jotform/mark-seen
  app.post("/api/jotform/mark-seen", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { jotformState } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const now = new Date().toISOString().replace("T", " ").substring(0, 19);
      const db = await getDb();
      if (db) {
        const rows = await db.select().from(jotformState).where(eq(jotformState.formId, JOTFORM_FORM_ID)).limit(1);
        if (rows.length > 0) {
          await db.update(jotformState).set({ lastSeenAt: now }).where(eq(jotformState.formId, JOTFORM_FORM_ID));
        } else {
          await db.insert(jotformState).values({ formId: JOTFORM_FORM_ID, lastSeenAt: now });
        }
      }
      res.json({ success: true, markedAt: now });
    } catch (error: any) {
      console.error("[JotForm] Error mark-seen:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
