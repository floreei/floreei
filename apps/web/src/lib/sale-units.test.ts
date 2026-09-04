import { describe, expect, it } from "vitest";
import { productPackCost, suggestedUnitCost } from "./sale-units";

describe("productPackCost", () => {
  it("usa o custo atual × packSize quando há custo atual", () => {
    expect(
      productPackCost({ currentUnitCost: 3, defaultPurchasePrice: 15, packSize: 5 }),
    ).toBe(15);
  });

  it("cai no preço de compra padrão quando o custo atual é zero", () => {
    expect(
      productPackCost({ currentUnitCost: 0, defaultPurchasePrice: 20, packSize: 10 }),
    ).toBe(20);
  });

  it("produto sem pacote: custo atual é o custo da unidade", () => {
    expect(
      productPackCost({ currentUnitCost: 4.5, defaultPurchasePrice: 4, packSize: 1 }),
    ).toBe(4.5);
  });
});

describe("suggestedUnitCost", () => {
  const rosa = { packSize: 5, purchaseUnit: "MACO", unit: "HASTE", price: 25, cost: 15 } as const;

  it("maço = custo cheio; haste = custo do maço ÷ packSize", () => {
    expect(suggestedUnitCost(rosa, "MACO")).toBe(15);
    expect(suggestedUnitCost(rosa, "HASTE")).toBe(3);
  });

  it("sem escolha de unidade devolve o custo direto", () => {
    expect(suggestedUnitCost({ packSize: 1, price: 10, cost: 6 })).toBe(6);
  });
});
