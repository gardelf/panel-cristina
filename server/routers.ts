import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getFireflyService } from "./firefly";
import { getGoogleSheetsService } from "./googleSheets";

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
  }),
});

export type AppRouter = typeof appRouter;
