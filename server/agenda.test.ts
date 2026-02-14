import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Agenda Router", () => {
  it("should upload agenda data successfully", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const testData = {
      clases: [
        {
          dia: "Lunes",
          hora: "09:00",
          nivel: "Principiante",
          plazas: 10,
        },
      ],
    };

    const result = await caller.agenda.upload({ data: testData });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Agenda subida correctamente");
  });

  it("should retrieve latest agenda data", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "test", role: "admin" } as any,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.agenda.getLatest();

    // Puede no haber datos si es la primera vez
    expect(result).toHaveProperty("hasData");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("uploadedAt");
  });
});
