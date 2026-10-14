import { describe, expect, it } from "vitest";
import { buildCobrancaText, greetingFor } from "./cobranca-message";

describe("greetingFor", () => {
  it("bom dia até o meio-dia, boa tarde até as 18h, boa noite depois", () => {
    expect(greetingFor(new Date(2026, 9, 14, 0, 0))).toBe("bom dia");
    expect(greetingFor(new Date(2026, 9, 14, 11, 59))).toBe("bom dia");
    expect(greetingFor(new Date(2026, 9, 14, 12, 0))).toBe("boa tarde");
    expect(greetingFor(new Date(2026, 9, 14, 17, 59))).toBe("boa tarde");
    expect(greetingFor(new Date(2026, 9, 14, 18, 0))).toBe("boa noite");
    expect(greetingFor(new Date(2026, 9, 14, 23, 30))).toBe("boa noite");
  });
});

describe("buildCobrancaText", () => {
  it("saúda conforme a hora, cita o dia do pedido e o link da nota", () => {
    const text = buildCobrancaText({
      saleDate: "2026-10-09",
      link: "https://app.floreei.com.br/c/abc",
      now: new Date(2026, 9, 14, 9, 0),
    });
    expect(text).toBe(
      [
        "Olá, bom dia! Tudo bem?",
        "",
        "Passando para lhe encaminhar sua nota do pedido do dia 09/10.",
        "Segue o link da nota para pagamento: https://app.floreei.com.br/c/abc",
      ].join("\n"),
    );
  });

  it("à tarde muda só a saudação", () => {
    const text = buildCobrancaText({
      saleDate: "2026-10-09",
      link: "https://x/c/1",
      now: new Date(2026, 9, 14, 15, 0),
    });
    expect(text.startsWith("Olá, boa tarde! Tudo bem?")).toBe(true);
  });

  it("não traz valor nem nome do cliente", () => {
    const text = buildCobrancaText({
      saleDate: "2026-10-09",
      link: "https://x/c/1",
      now: new Date(2026, 9, 14, 15, 0),
    });
    expect(text).not.toMatch(/R\$/);
  });
});
