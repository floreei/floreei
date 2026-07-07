import { describe, expect, it } from "vitest";
import { buildPixPayload, isValidPixPayload } from "./pix";

describe("buildPixPayload", () => {
  it("monta um BR Code estático válido com valor e CRC correto", () => {
    const payload = buildPixPayload({
      key: "pagamentos@floricultura.com.br",
      merchantName: "Floricultura Jardim",
      amount: 197.5,
      txid: "A1B2C3D4",
    });

    expect(payload.startsWith("000201")).toBe(true); // formato 01
    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("pagamentos@floricultura.com.br");
    expect(payload).toContain("5303986"); // moeda BRL
    expect(payload).toContain("5406197.50"); // valor com 2 casas
    expect(payload).toContain("5802BR");
    expect(payload).toContain("FLORICULTURA JARDIM");
    expect(payload).toContain("0508A1B2C3D4"); // txid
    expect(isValidPixPayload(payload)).toBe(true);
  });

  it("sem valor, deixa o pagador digitar (campo 54 ausente)", () => {
    const payload = buildPixPayload({
      key: "11999998888",
      merchantName: "Maria",
    });
    // O campo 54 (valor) viria logo após a moeda (5303986).
    expect(payload).not.toContain("530398654");
    expect(payload).toContain("6006BRASIL"); // cidade padrão
    expect(isValidPixPayload(payload)).toBe(true);
  });

  it("remove acentos e limita o nome a 25 caracteres", () => {
    const payload = buildPixPayload({
      key: "chave",
      merchantName: "Floricultura São João das Águas Claras",
      amount: 10,
    });
    expect(payload).toContain("FLORICULTURA SAO JOAO DAS");
    expect(isValidPixPayload(payload)).toBe(true);
  });

  it("detecta payload corrompido", () => {
    const payload = buildPixPayload({ key: "chave", merchantName: "Loja" });
    expect(isValidPixPayload(payload.replace("br.gov", "xx.gov"))).toBe(false);
  });
});
