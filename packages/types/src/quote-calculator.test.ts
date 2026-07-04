import { describe, expect, it } from "vitest";
import { calculateItem, calculateQuote, marginPercent } from "./quote-calculator";

describe("calculateItem", () => {
  it("calcula custo, venda, lucro e margem", () => {
    expect(calculateItem({ quantity: 10, purchasePrice: 12.5, salePrice: 30 })).toEqual({
      lineCost: 125,
      lineSale: 300,
      lineProfit: 175,
      marginPct: 58.33,
    });
  });

  it("evita erro de ponto flutuante", () => {
    const r = calculateItem({ quantity: 3, purchasePrice: 0.1, salePrice: 0.2 });
    expect(r.lineCost).toBe(0.3);
    expect(r.lineSale).toBe(0.6);
  });
});

describe("calculateQuote", () => {
  it("soma itens", () => {
    const t = calculateQuote([
      { quantity: 10, purchasePrice: 12.5, salePrice: 30 },
      { quantity: 2, purchasePrice: 50, salePrice: 90 },
    ]);
    expect(t).toEqual({ totalCost: 225, totalSale: 480, totalProfit: 255, marginPct: 53.13 });
  });

  it("vazio zera", () => {
    expect(calculateQuote([])).toEqual({
      totalCost: 0,
      totalSale: 0,
      totalProfit: 0,
      marginPct: 0,
    });
  });
});

describe("marginPercent", () => {
  it("zero quando venda 0", () => {
    expect(marginPercent(10, 0)).toBe(0);
  });
});
