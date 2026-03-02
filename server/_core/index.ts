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
