import {
  calculateItem,
  calculateQuote,
  marginPercent,
} from "./quote-calculator";

describe("calculateItem", () => {
  it("calcula custo, venda, lucro e margem", () => {
    const result = calculateItem({
      quantity: 10,
      purchasePrice: 12.5,
      salePrice: 30,
    });
    expect(result.lineCost).toBe(125);
    expect(result.lineSale).toBe(300);
    expect(result.lineProfit).toBe(175);
    expect(result.marginPct).toBe(58.33);
  });

  it("suporta quantidades fracionadas", () => {
    const result = calculateItem({
      quantity: 1.5,
      purchasePrice: 10,
      salePrice: 20,
    });
    expect(result.lineCost).toBe(15);
    expect(result.lineSale).toBe(30);
    expect(result.lineProfit).toBe(15);
    expect(result.marginPct).toBe(50);
  });

  it("margem é zero quando o preço de venda é zero", () => {
    const result = calculateItem({
      quantity: 5,
      purchasePrice: 10,
      salePrice: 0,
    });
    expect(result.lineSale).toBe(0);
    expect(result.lineProfit).toBe(-50);
    expect(result.marginPct).toBe(0);
  });

  it("arredonda corretamente evitando erro de ponto flutuante", () => {
    const result = calculateItem({
      quantity: 3,
      purchasePrice: 0.1,
      salePrice: 0.2,
    });
    expect(result.lineCost).toBe(0.3);
    expect(result.lineSale).toBe(0.6);
    expect(result.lineProfit).toBe(0.3);
  });
});

describe("calculateQuote", () => {
  it("soma os itens", () => {
    const totals = calculateQuote([
      { quantity: 10, purchasePrice: 12.5, salePrice: 30 },
      { quantity: 2, purchasePrice: 50, salePrice: 90 },
    ]);
    expect(totals.totalCost).toBe(225);
    expect(totals.totalSale).toBe(480);
    expect(totals.totalProfit).toBe(255);
    expect(totals.marginPct).toBe(53.13);
  });

  it("orçamento vazio tem totais zerados", () => {
    const totals = calculateQuote([]);
    expect(totals).toEqual({
      totalCost: 0,
      totalSale: 0,
      totalProfit: 0,
      marginPct: 0,
    });
  });
});

describe("marginPercent", () => {
  it("retorna 0 quando a venda é 0", () => {
    expect(marginPercent(100, 0)).toBe(0);
  });
  it("calcula percentual sobre a venda", () => {
    expect(marginPercent(50, 200)).toBe(25);
  });
});
