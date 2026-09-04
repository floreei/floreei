import { describe, expect, it } from "vitest";
import { insightsQuerySchema, quickSaleItemSchema } from "./event";

describe("insightsQuerySchema", () => {
  it("aceita os filtros da tela além do período", () => {
    const parsed = insightsQuerySchema.parse({
      from: "2026-08-01",
      to: "2026-08-31",
      channel: "WHOLESALE",
      type: "ORDER",
      paymentStatus: "pending",
      delivered: "false",
      search: "  Mercado ",
    });
    expect(parsed.paymentStatus).toBe("pending");
    expect(parsed.delivered).toBe(false);
    expect(parsed.type).toBe("ORDER");
    expect(parsed.search).toBe("Mercado");
  });

  it("rejeita paymentStatus inválido", () => {
    expect(() =>
      insightsQuerySchema.parse({ paymentStatus: "xyz" }),
    ).toThrow();
  });

  it("continua aceitando só período e canal (compat)", () => {
    const parsed = insightsQuerySchema.parse({ channel: "RETAIL" });
    expect(parsed.delivered).toBeUndefined();
    expect(parsed.search).toBeUndefined();
  });
});

describe("quickSaleItemSchema.unitCost", () => {
  it("aceita unitCost numérico (string coerida) e opcional", () => {
    const withCost = quickSaleItemSchema.parse({
      productId: "3f6c2c6e-6f9a-4b1a-9c3e-1f2a3b4c5d6e",
      quantity: 2,
      unitCost: "15.5",
    });
    expect(withCost.unitCost).toBe(15.5);

    const without = quickSaleItemSchema.parse({
      productId: "3f6c2c6e-6f9a-4b1a-9c3e-1f2a3b4c5d6e",
      quantity: 2,
    });
    expect(without.unitCost).toBeUndefined();
  });

  it("rejeita unitCost negativo", () => {
    expect(() =>
      quickSaleItemSchema.parse({
        productId: "3f6c2c6e-6f9a-4b1a-9c3e-1f2a3b4c5d6e",
        quantity: 1,
        unitCost: -1,
      }),
    ).toThrow();
  });
});
