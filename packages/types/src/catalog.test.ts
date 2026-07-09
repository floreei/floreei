import { describe, expect, it } from "vitest";
import { productInputSchema } from "./catalog";

describe("productInputSchema", () => {
  const base = {
    categoryId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Rosa Colombiana",
  };

  it("aceita um NCM de 8 dígitos", () => {
    const parsed = productInputSchema.parse({ ...base, ncm: "06031100" });
    expect(parsed.ncm).toBe("06031100");
  });

  it("NCM vazio vira undefined (campo opcional)", () => {
    const parsed = productInputSchema.parse({ ...base, ncm: "" });
    expect(parsed.ncm).toBeUndefined();
  });

  it("rejeita NCM com formato inválido", () => {
    const result = productInputSchema.safeParse({ ...base, ncm: "123" });
    expect(result.success).toBe(false);
  });
});
