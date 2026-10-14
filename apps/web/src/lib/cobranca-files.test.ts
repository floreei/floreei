import { describe, expect, it } from "vitest";
import { cobrancaFileName, cobrancasZipName } from "./cobranca-files";

describe("cobrancaFileName", () => {
  it("usa cliente e data de entrega, sem acentos nem caracteres de caminho", () => {
    expect(
      cobrancaFileName({
        customerName: "Mercado São João / Filial",
        date: "2026-10-09",
        deliveryDate: "2026-10-15",
      }),
    ).toBe("Nota - Mercado Sao Joao Filial - 15-10-2026.pdf");
  });

  it("sem data de entrega, usa a data da venda", () => {
    expect(
      cobrancaFileName({ customerName: "Flor & Cia", date: "2026-10-09", deliveryDate: null }),
    ).toBe("Nota - Flor Cia - 09-10-2026.pdf");
  });

  it("corta nomes muito longos", () => {
    const name = cobrancaFileName({
      customerName: "x".repeat(200),
      date: "2026-10-09",
      deliveryDate: null,
    });
    expect(name.length).toBeLessThanOrEqual(90);
    expect(name.endsWith(" - 09-10-2026.pdf")).toBe(true);
  });
});

describe("cobrancasZipName", () => {
  it("leva o período filtrado", () => {
    expect(cobrancasZipName("2026-10-01", "2026-10-31")).toBe(
      "Notas atacado - 2026-10-01 a 2026-10-31.zip",
    );
  });

  it("sem período, só a data de hoje", () => {
    expect(cobrancasZipName("", "", new Date(2026, 9, 14))).toBe(
      "Notas atacado - 2026-10-14.zip",
    );
  });
});
