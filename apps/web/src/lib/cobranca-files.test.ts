import { describe, expect, it } from "vitest";
import { cobrancaFileName, cobrancasZipName } from "./cobranca-files";

describe("cobrancaFileName", () => {
  it("usa cliente e referência, sem acentos nem caracteres de caminho", () => {
    expect(
      cobrancaFileName({ customerName: "Mercado São João / Filial", reference: "A1B2C3D4" }),
    ).toBe("Nota - Mercado Sao Joao Filial - A1B2C3D4.pdf");
  });

  it("corta nomes muito longos", () => {
    const name = cobrancaFileName({ customerName: "x".repeat(200), reference: "REF" });
    expect(name.length).toBeLessThanOrEqual(90);
    expect(name.endsWith(" - REF.pdf")).toBe(true);
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
