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
