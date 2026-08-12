import { describe, expect, it } from "vitest";
import { insightsQuerySchema } from "./event";

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
