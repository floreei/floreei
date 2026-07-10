import { describe, expect, it } from "vitest";
import { ncmSearchQuerySchema } from "./ncm";

describe("ncmSearchQuerySchema", () => {
  it("aceita um termo de busca válido", () => {
    const parsed = ncmSearchQuerySchema.parse({ q: "rosa" });
    expect(parsed.q).toBe("rosa");
  });

  it("apara espaços nas pontas", () => {
    const parsed = ncmSearchQuerySchema.parse({ q: "  rosa  " });
    expect(parsed.q).toBe("rosa");
  });

  it("rejeita termo vazio", () => {
    const result = ncmSearchQuerySchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita termo acima de 60 caracteres", () => {
    const result = ncmSearchQuerySchema.safeParse({ q: "a".repeat(61) });
    expect(result.success).toBe(false);
  });
});
