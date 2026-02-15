import { describe, it, expect } from "vitest";

describe("Cálculos de Márgenes", () => {
  describe("Margen Estudio", () => {
    it("debe calcular correctamente: Ingresos previstos - Gastos Estudio", () => {
      const ingresosPrevistos = 6875.00;
      const gastosEstudio = 750.00;
      const margenEstudio = ingresosPrevistos - gastosEstudio;

      expect(margenEstudio).toBe(6125.00);
    });

    it("debe devolver valor negativo cuando gastos superan ingresos", () => {
      const ingresosPrevistos = 500.00;
      const gastosEstudio = 750.00;
      const margenEstudio = ingresosPrevistos - gastosEstudio;

      expect(margenEstudio).toBe(-250.00);
      expect(margenEstudio).toBeLessThan(0);
    });

    it("debe devolver cero cuando ingresos y gastos son iguales", () => {
      const ingresosPrevistos = 750.00;
      const gastosEstudio = 750.00;
      const margenEstudio = ingresosPrevistos - gastosEstudio;

      expect(margenEstudio).toBe(0);
    });
  });

  describe("Margen Personal", () => {
    it("debe calcular correctamente: Margen Estudio - Gastos personales del mes", () => {
      const margenEstudio = 6125.00;
      const gastosPersonalesMes = 150.00;
      const margenPersonal = margenEstudio - gastosPersonalesMes;

      expect(margenPersonal).toBe(5975.00);
    });

    it("debe devolver valor negativo cuando gastos personales superan margen estudio", () => {
      const margenEstudio = 100.00;
      const gastosPersonalesMes = 500.00;
      const margenPersonal = margenEstudio - gastosPersonalesMes;

      expect(margenPersonal).toBe(-400.00);
      expect(margenPersonal).toBeLessThan(0);
    });

    it("debe calcular correctamente con margen estudio negativo", () => {
      const margenEstudio = -250.00; // Gastos Estudio > Ingresos
      const gastosPersonalesMes = 150.00;
      const margenPersonal = margenEstudio - gastosPersonalesMes;

      expect(margenPersonal).toBe(-400.00);
      expect(margenPersonal).toBeLessThan(margenEstudio);
    });
  });

  describe("Flujo completo de cálculos", () => {
    it("debe calcular ambos márgenes correctamente desde datos base", () => {
      // Datos base
      const ingresosPrevistos = 6875.00;
      const gastosEstudio = 750.00;
      const gastosPersonalesMes = 150.00;

      // Cálculo Margen Estudio
      const margenEstudio = ingresosPrevistos - gastosEstudio;
      expect(margenEstudio).toBe(6125.00);

      // Cálculo Margen Personal
      const margenPersonal = margenEstudio - gastosPersonalesMes;
      expect(margenPersonal).toBe(5975.00);

      // Verificar relación: Margen Personal < Margen Estudio < Ingresos Previstos
      expect(margenPersonal).toBeLessThan(margenEstudio);
      expect(margenEstudio).toBeLessThan(ingresosPrevistos);
    });

    it("debe manejar escenario con todos los gastos cubiertos", () => {
      const ingresosPrevistos = 10000.00;
      const gastosEstudio = 2000.00;
      const gastosPersonalesMes = 3000.00;

      const margenEstudio = ingresosPrevistos - gastosEstudio;
      expect(margenEstudio).toBe(8000.00);

      const margenPersonal = margenEstudio - gastosPersonalesMes;
      expect(margenPersonal).toBe(5000.00);

      // Ambos márgenes positivos
      expect(margenEstudio).toBeGreaterThan(0);
      expect(margenPersonal).toBeGreaterThan(0);
    });

    it("debe manejar escenario crítico con gastos excesivos", () => {
      const ingresosPrevistos = 1000.00;
      const gastosEstudio = 800.00;
      const gastosPersonalesMes = 500.00;

      const margenEstudio = ingresosPrevistos - gastosEstudio;
      expect(margenEstudio).toBe(200.00);

      const margenPersonal = margenEstudio - gastosPersonalesMes;
      expect(margenPersonal).toBe(-300.00);

      // Margen Estudio positivo pero Margen Personal negativo
      expect(margenEstudio).toBeGreaterThan(0);
      expect(margenPersonal).toBeLessThan(0);
    });
  });

  describe("Casos edge", () => {
    it("debe manejar valores cero", () => {
      const margenEstudio = 1000.00 - 0;
      const margenPersonal = margenEstudio - 0;

      expect(margenEstudio).toBe(1000.00);
      expect(margenPersonal).toBe(1000.00);
    });

    it("debe manejar decimales correctamente", () => {
      const ingresosPrevistos = 6875.50;
      const gastosEstudio = 750.25;
      const gastosPersonalesMes = 150.75;

      const margenEstudio = ingresosPrevistos - gastosEstudio;
      expect(margenEstudio).toBeCloseTo(6125.25, 2);

      const margenPersonal = margenEstudio - gastosPersonalesMes;
      expect(margenPersonal).toBeCloseTo(5974.50, 2);
    });
  });
});
