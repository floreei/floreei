import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  it("aceita cadastro válido e normaliza e-mail", () => {
    const parsed = registerSchema.parse({
      companyName: "Flor & Cia",
      name: "Ana",
      email: "ANA@flor.com",
      password: "segredo123",
    });
    expect(parsed.email).toBe("ana@flor.com");
  });

  it("rejeita senha curta", () => {
    expect(() =>
      registerSchema.parse({
        companyName: "Flor",
        name: "Ana",
        email: "ana@flor.com",
        password: "123",
      }),
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("exige senha não-vazia", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "" })).toThrow();
  });
});
