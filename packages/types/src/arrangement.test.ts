import { describe, expect, it } from "vitest";
import { arrangementSalePrice, calculateArrangement } from "./arrangement";

describe("arrangementSalePrice", () => {
  it("FIXED usa o preço digitado", () => {
    expect(arrangementSalePrice(3, "FIXED", { salePrice: 25 })).toBe(25);
  });

  it("PROFIT_VALUE soma o lucro em R$ ao custo", () => {
    expect(arrangementSalePrice(3, "PROFIT_VALUE", { profitValue: 7 })).toBe(10);
  });

  it("MARGIN_PCT é markup sobre o custo (100% dobra o custo)", () => {
    expect(arrangementSalePrice(3, "MARGIN_PCT", { profitPct: 100 })).toBe(6);
  });

  it("MARGIN_PCT com 0% devolve o próprio custo", () => {
    expect(arrangementSalePrice(3, "MARGIN_PCT", { profitPct: 0 })).toBe(3);
  });

  it("MARGIN_PCT aceita markup acima de 100% (sem o antigo teto de 99,99)", () => {
    expect(arrangementSalePrice(10, "MARGIN_PCT", { profitPct: 150 })).toBe(25);
  });

  it("markup equivalente à margem antiga preserva o preço (margem 50% ⇒ markup 100%)", () => {
    // Migração converte profit_pct = margem/(1 - margem/100): 50 → 100.
    // Preço antigo (margem 50%): custo/(1-0.5) = 6. Novo (markup 100%): 6.
    expect(arrangementSalePrice(3, "MARGIN_PCT", { profitPct: 100 })).toBe(6);
  });
});

describe("calculateArrangement", () => {
  it("soma o custo dos componentes e calcula margem e %", () => {
    expect(
      calculateArrangement(
        [
          { quantity: 3, unitCost: 2 },
          { quantity: 1, unitCost: 4 },
        ],
        25,
      ),
    ).toEqual({ cost: 10, margin: 15, marginPercent: 60 });
  });

  it("sem componentes, custo é 0 e margem é o próprio preço", () => {
    expect(calculateArrangement([], 25)).toEqual({
      cost: 0,
      margin: 25,
      marginPercent: 100,
    });
  });

  it("preço abaixo do custo produz margem negativa", () => {
    expect(calculateArrangement([{ quantity: 2, unitCost: 10 }], 15)).toEqual({
      cost: 20,
      margin: -5,
      marginPercent: -33.33,
    });
  });

  it("arredonda cada linha de custo (money) antes de somar", () => {
    // 3 × 0.335 = 1.005 → arredonda para 1.01 por linha.
    expect(
      calculateArrangement([{ quantity: 3, unitCost: 0.335 }], 5).cost,
    ).toBe(1.01);
  });
});
