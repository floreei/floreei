import { describe, expect, it } from "vitest";
import { maskCep, maskCpfCnpj, maskPhone } from "./masks";

describe("maskPhone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(maskPhone("11912345678")).toBe("(11) 91234-5678");
  });
  it("formata fixo com 10 dígitos", () => {
    expect(maskPhone("1132145678")).toBe("(11) 3214-5678");
  });
  it("ignora não-dígitos e limita o tamanho", () => {
    expect(maskPhone("(11) 9abc")).toBe("(11) 9");
    expect(maskPhone("11912345678999")).toBe("(11) 91234-5678");
  });
  it("string vazia continua vazia", () => {
    expect(maskPhone("")).toBe("");
  });
});

describe("maskCpfCnpj", () => {
  it("formata CPF (11 dígitos)", () => {
    expect(maskCpfCnpj("12345678901")).toBe("123.456.789-01");
  });
  it("formata CNPJ (14 dígitos)", () => {
    expect(maskCpfCnpj("12345678000199")).toBe("12.345.678/0001-99");
  });
  it("formata parcialmente durante a digitação", () => {
    expect(maskCpfCnpj("123")).toBe("123");
    expect(maskCpfCnpj("1234")).toBe("123.4");
  });
});

describe("maskCep", () => {
  it("formata CEP", () => {
    expect(maskCep("01234567")).toBe("01234-567");
  });
});
