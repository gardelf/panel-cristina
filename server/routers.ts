import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getFireflyService } from "./firefly";
import { getGoogleSheetsService } from "./googleSheets";
import { z } from "zod";
import { getDb } from "./db";
import { agenda } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  income: router({
    summary: protectedProcedure.query(async () => {
      const sheets = getGoogleSheetsService();

      if (!sheets.isEnabled()) {
        return {
          enabled: false,
          currentIncome: 0,
          pendingIncome: 0,
          projectedIncome: 0,
        };
      }

      try {
        const income = await sheets.calculateIncome();

        return {
          enabled: true,
          ...income,
        };
      } catch (error) {
        console.error("[Income] Error fetching data:", error);
        throw new Error("Error al obtener datos de ingresos");
      }
    }),
  }),

  agenda: router({
    // Endpoint para recibir agenda.json desde Playwright
    upload: publicProcedure
      .input(z.any()) // Aceptar cualquier JSON
      .mutation(async ({ input }) => {
        try {
          console.log('[Agenda] Recibiendo datos:', typeof input, Array.isArray(input));
          
          const db = await getDb();
          if (!db) {
            throw new Error("Base de datos no disponible");
          }

          // Validar que input no sea undefined o null
          if (!input) {
            throw new Error("No se recibieron datos");
          }

          // Convertir a JSON string
          const dataStr = JSON.stringify(input);
          console.log('[Agenda] Guardando', dataStr.length, 'caracteres');

          // Guardar en base de datos
          await db.insert(agenda).values({
            data: dataStr,
          });

          return {
            success: true,
            message: "Agenda subida correctamente",
          };
        } catch (error) {
          console.error("[Agenda] Error al guardar:", error);
          throw new Error("Error al guardar agenda");
        }
      }),

    // Endpoint para obtener la última agenda
    getLatest: protectedProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Base de datos no disponible");
        }

        const latest = await db
          .select()
          .from(agenda)
          .orderBy(desc(agenda.uploadedAt))
          .limit(1);

        if (latest.length === 0) {
          return {
            hasData: false,
            data: null,
            uploadedAt: null,
          };
        }

        return {
          hasData: true,
          data: JSON.parse(latest[0].data),
          uploadedAt: latest[0].uploadedAt,
        };
      } catch (error) {
        console.error("[Agenda] Error al obtener:", error);
        throw new Error("Error al obtener agenda");
      }
    }),
  }),

  expenses: router({
    summary: protectedProcedure.query(async () => {
      const firefly = getFireflyService();

      if (!firefly.isEnabled()) {
        return {
          enabled: false,
          currentMonth: 0,
          lastWeek: 0,
          yesterday: 0,
          nextMonthExtraordinary: 0,
        };
      }

      try {
        const [currentMonth, lastWeek, yesterday, nextMonthExtraordinary] =
          await Promise.all([
            firefly.getCurrentMonthExpenses(),
            firefly.getLastWeekExpenses(),
            firefly.getYesterdayExpenses(),
            firefly.getNextMonthExtraordinaryExpenses(),
          ]);

        return {
          enabled: true,
          currentMonth,
          lastWeek,
          yesterday,
          nextMonthExtraordinary,
        };
      } catch (error) {
        console.error("[Expenses] Error fetching data:", error);
        throw new Error("Error al obtener datos de gastos");
      }
    }),

    studio: protectedProcedure.query(async () => {
      const firefly = getFireflyService();

      if (!firefly.isEnabled()) {
        return {
          enabled: false,
          total: 0,
          transactions: [],
        };
      }

      try {
        const data = await firefly.getStudioAccountExpenses();

        return {
          enabled: true,
          ...data,
        };
      } catch (error) {
        console.error("[Expenses] Error fetching studio data:", error);
        throw new Error("Error al obtener datos de gastos del Estudio");
      }
    }),

    yesterday: protectedProcedure.query(async () => {
      const firefly = getFireflyService();

      if (!firefly.isEnabled()) {
        return {
          enabled: false,
          total: 0,
          transactions: [],
        };
      }

      try {
        const data = await firefly.getYesterdayExpensesDetailed();

        return {
          enabled: true,
          ...data,
        };
      } catch (error) {
        console.error("[Expenses] Error fetching yesterday data:", error);
        throw new Error("Error al obtener datos de gastos de ayer");
      }
    }),

    extraordinary: protectedProcedure.query(async () => {
      const firefly = getFireflyService();

      if (!firefly.isEnabled()) {
        return {
          enabled: false,
          total: 0,
          transactions: [],
        };
      }

      try {
        const data = await firefly.getNextMonthExtraordinaryExpensesDetailed();

        return {
          enabled: true,
          ...data,
        };
      } catch (error) {
        console.error("[Expenses] Error fetching extraordinary data:", error);
        throw new Error("Error al obtener datos de gastos extraordinarios");
      }
    }),

    // Endpoint para crear gastos desde atajo de iPhone
    create: publicProcedure
      .input(
        z.object({
          description: z.string().min(1, "La descripción es requerida"),
          amount: z.number().positive("El monto debe ser positivo"),
          date: z.string().optional(),
          category: z.string().optional(),
          sourceAccount: z.string().optional(),
          destinationAccount: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const firefly = getFireflyService();

        if (!firefly.isEnabled()) {
          throw new Error("Firefly III no está configurado");
        }

        try {
          console.log("[Expenses] Creando transacción:", input);
          const result = await firefly.createTransaction(input);

          if (!result.success) {
            throw new Error(result.error || "Error al crear transacción");
          }

          return {
            success: true,
            transactionId: result.transactionId,
            message: "Gasto registrado correctamente",
          };
        } catch (error: any) {
          console.error("[Expenses] Error creating transaction:", error);
          throw new Error(error.message || "Error al crear gasto");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
