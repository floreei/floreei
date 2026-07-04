import { describe, expect, it } from "vitest";
import { emailSchema, moneySchema, quantitySchema } from "./common";
import { roleSchema } from "./enums";

describe("emailSchema", () => {
  it("normaliza para lowercase e remove espaços", () => {
    expect(emailSchema.parse("  Joao@Flores.COM ")).toBe("joao@flores.com");
  });

  it("rejeita e-mail inválido", () => {
    expect(() => emailSchema.parse("nao-email")).toThrow();
  });
});

describe("moneySchema", () => {
  it("aceita string numérica e converte para number", () => {
    expect(moneySchema.parse("12.50")).toBe(12.5);
  });

  it("rejeita valor negativo", () => {
    expect(() => moneySchema.parse(-1)).toThrow();
  });
});

describe("quantitySchema", () => {
  it("rejeita zero", () => {
    expect(() => quantitySchema.parse(0)).toThrow();
  });

  it("aceita frações", () => {
    expect(quantitySchema.parse(1.5)).toBe(1.5);
  });
});

describe("roleSchema", () => {
  it("aceita papéis válidos", () => {
    expect(roleSchema.parse("ADMIN")).toBe("ADMIN");
    expect(roleSchema.parse("OPERATOR")).toBe("OPERATOR");
  });

  it("rejeita papel desconhecido", () => {
    expect(() => roleSchema.parse("ROOT")).toThrow();
  });
});
