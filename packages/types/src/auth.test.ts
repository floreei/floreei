import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  it("aceita cadastro válido e normaliza e-mail", () => {
    const parsed = registerSchema.parse({
      companyName: "Flor & Cia",
      name: "Ana",
      document: "12.345.678/0001-90",
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
        document: "12345678000190",
        email: "ana@flor.com",
        password: "123",
      }),
    ).toThrow();
  });

  it("exige CNPJ (14) ou CPF (11) dígitos", () => {
    const base = {
      companyName: "Flor",
      name: "Ana",
      email: "ana@flor.com",
      password: "segredo123",
    };
    expect(() => registerSchema.parse({ ...base, document: "123" })).toThrow();
    // CPF com máscara
    expect(
      registerSchema.parse({ ...base, document: "123.456.789-01" }).document,
    ).toBe("123.456.789-01");
  });
});

describe("loginSchema", () => {
  it("exige senha não-vazia", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "" })).toThrow();
  });
});
