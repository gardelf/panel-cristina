import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // REST endpoint para registrar gastos desde atajo de iPhone
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

      const extracted = await extraerDatosConIA(texto);

      if (!extracted.monto || !extracted.descripcion) {
        return res.status(400).json({ success: "No se pudo extraer monto y descripción del texto" });
      }

      let categoria = extracted.categoria;
      if (!categoria || categoria === "Otros") {
        const result = categorizarGasto(extracted.descripcion);
        categoria = result.categoria;
      }

      const descripcionLower = extracted.descripcion.toLowerCase();
      const esEstudio = descripcionLower.includes("estudio") ||
                       descripcionLower.includes("trabajo") ||
                       descripcionLower.includes("oficina") ||
                       descripcionLower.includes("clase") ||
                       descripcionLower.includes("alumno");

      const destinationAccount = esEstudio ? "Estudio" : "Personales";

      await firefly.createTransaction({
        type: "withdrawal",
        description: extracted.descripcion,
        amount: extracted.monto,
        date: extracted.fecha || new Date().toISOString().split("T")[0],
        sourceAccount: "Cash",
        destinationAccount,
        category: categoria || undefined,
        tags: extracted.tags.length > 0 ? extracted.tags : undefined,
      });

      const tagStr = extracted.tags.length > 0 ? ` [${extracted.tags.join(", ")}]` : "";
      const successMsg = `✅ ${extracted.descripcion} - ${extracted.monto}€ → ${destinationAccount} (${categoria})${tagStr}`;

      console.log(`[Expenses] Gasto registrado: ${successMsg}`);
      res.json({ success: successMsg });
    } catch (error: any) {
      console.error("[Expenses] Error:", error);
      res.status(500).json({ success: `Error: ${error.message}` });
    }
  });

  // REST endpoint para subir agenda desde script Playwright local
  app.post("/api/agenda/upload", async (req, res) => {
    try {
      const agendaData = req.body;

      if (!agendaData || !Array.isArray(agendaData)) {
        return res.status(400).json({ success: false, error: "Se esperaba un array de clases" });
      }

      const { getDb } = await import("../db");
      const { agenda } = await import("../../drizzle/schema");

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ success: false, error: "Base de datos no disponible" });
      }

      const dataStr = JSON.stringify(agendaData);
      await db.insert(agenda).values({ data: dataStr });

      console.log(`[Agenda] Subidas ${agendaData.length} clases via REST`);
      res.json({ success: true, count: agendaData.length, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Agenda] Error al subir:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Proxy endpoint para obtener datos de stock de Medigest
  app.get("/api/medigest/stock", async (_req, res) => {
    try {
      const medigestUrl = process.env.MEDIGEST_URL || "https://medigest-production.up.railway.app";
      const response = await fetch(
        `${medigestUrl}/api/trpc/medicamentos.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`
      );

      if (!response.ok) {
        return res.status(502).json({ error: "Error al conectar con Medigest" });
      }

      const raw = await response.json() as Array<{ result: { data: { json: Array<{
        id: number; nombre: string; dosis: string; stockActual: number;
        stockMinimo: number; precioCaja: string; unidadesPorEnvase: number;
      }> } } }>;

      const medicamentos = raw[0]?.result?.data?.json || [];

      // Calcular niveles de stock
      const criticos = medicamentos.filter((m) => m.stockActual < m.stockMinimo && m.stockActual > 0);
      const sinStock = medicamentos.filter((m) => m.stockActual === 0);
      const bajos = medicamentos.filter((m) => {
        const ratio = m.stockActual / m.stockMinimo;
        return m.stockActual >= m.stockMinimo && ratio < 1.5;
      });

      // Lista de compra: críticos + sin stock
      const listaCompra = [...sinStock, ...criticos].map((m) => ({
        nombre: m.nombre,
        dosis: m.dosis,
        stockActual: m.stockActual,
        stockMinimo: m.stockMinimo,
        precioCaja: parseFloat(m.precioCaja),
        estado: m.stockActual === 0 ? "sin_stock" : "critico",
      }));

      // Coste total de reposición (1 caja por medicamento en lista)
      const costeReposicion = listaCompra.reduce((sum, m) => sum + m.precioCaja, 0);

      // Coste mensual estimado (precio unitario × unidades consumidas al mes)
      const costeMensual = medicamentos.reduce((sum, m) => {
        const precioUnitario = parseFloat(m.precioCaja) / m.unidadesPorEnvase;
        return sum + precioUnitario * m.stockMinimo;
      }, 0);

      res.json({
        totalMedicamentos: medicamentos.length,
        stockCritico: criticos.length + sinStock.length,
        stockBajo: bajos.length,
        costeReposicion: Math.round(costeReposicion * 100) / 100,
        costeMensual: Math.round(costeMensual * 100) / 100,
        listaCompra,
        ultimaActualizacion: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[Medigest] Error:", error);
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

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
