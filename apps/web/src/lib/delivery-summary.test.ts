import type { PendingDeliverySale } from "@sistema-flores/types";
import { describe, expect, it } from "vitest";
import { buildDaySummary, daySummaryText } from "./delivery-summary";

const sale = (
  over: Partial<PendingDeliverySale> & { items: PendingDeliverySale["items"] },
): PendingDeliverySale => ({
  id: "s1",
  customerId: "c1",
  customerName: "Mercado",
  date: "2026-10-12",
  deliveryDate: null,
  totalValue: 0,
  ...over,
});

const item = (
  name: string,
  quantity: number,
  unit: PendingDeliverySale["items"][number]["unit"] = "MACO",
) => ({
  id: name.toLowerCase(),
  name,
  kind: "product" as const,
  quantity,
  unit,
  value: quantity * 10,
});

describe("buildDaySummary", () => {
  it("soma o mesmo produto de pedidos diferentes no mesmo dia", () => {
    const lines = buildDaySummary([
      sale({ id: "a", deliveryDate: "2026-10-14", items: [item("Gipso", 200)] }),
      sale({ id: "b", deliveryDate: "2026-10-14", items: [item("Gipso", 135)] }),
    ]);
    expect(lines).toEqual([
      { date: "2026-10-14", id: "gipso", kind: "product", name: "Gipso", unit: "MACO", quantity: 335 },
    ]);
  });

  it("produtos diferentes com o mesmo nome ficam em linhas separadas", () => {
    const lines = buildDaySummary([
      sale({
        id: "a",
        deliveryDate: "2026-10-14",
        items: [item("Gipso", 3), { ...item("Gipso", 2), id: "outro-gipso" }],
      }),
    ]);
    expect(lines.map((l) => l.id)).toEqual(["gipso", "outro-gipso"]);
  });

  it("soma quantidades fracionárias sem erro de ponto flutuante", () => {
    const lines = buildDaySummary([
      sale({ id: "a", deliveryDate: "2026-10-14", items: [item("Fita", 0.1, "METRO")] }),
      sale({ id: "b", deliveryDate: "2026-10-14", items: [item("Fita", 0.2, "METRO")] }),
    ]);
    expect(lines[0].quantity).toBe(0.3);
  });

  it("separa dias diferentes, em ordem cronológica, e maior quantidade primeiro no dia", () => {
    const lines = buildDaySummary([
      sale({ id: "a", deliveryDate: "2026-10-16", items: [item("Gipso", 50)] }),
      sale({
        id: "b",
        deliveryDate: "2026-10-14",
        items: [item("Gipso", 335), item("Hortênsia", 200)],
      }),
      sale({ id: "c", deliveryDate: "2026-10-15", items: [item("Gipso", 100)] }),
    ]);
    expect(lines.map((l) => `${l.date} ${l.quantity} ${l.name}`)).toEqual([
      "2026-10-14 335 Gipso",
      "2026-10-14 200 Hortênsia",
      "2026-10-15 100 Gipso",
      "2026-10-16 50 Gipso",
    ]);
  });

  it("pedido sem data de entrega entra pela data da venda", () => {
    const lines = buildDaySummary([
      sale({ id: "a", date: "2026-10-13", deliveryDate: null, items: [item("Gipso", 7)] }),
    ]);
    expect(lines[0].date).toBe("2026-10-13");
  });

  it("não mistura unidades diferentes do mesmo produto", () => {
    const lines = buildDaySummary([
      sale({
        id: "a",
        deliveryDate: "2026-10-14",
        items: [item("Gipso", 3, "MACO"), item("Gipso", 2, "CAIXA")],
      }),
    ]);
    expect(lines).toHaveLength(2);
  });
});

describe("daySummaryText", () => {
  it("agrupa por dia com dia da semana, plural da unidade e sem preço", () => {
    const text = daySummaryText({
      title: "Entregas — Falta entregar",
      period: "01/10 a 31/10",
      lines: [
        { date: "2026-10-14", id: "g", kind: "product", name: "Gipso", unit: "MACO", quantity: 335 },
        { date: "2026-10-14", id: "h", kind: "product", name: "Hortênsia", unit: "MACO", quantity: 200 },
        { date: "2026-10-15", id: "g", kind: "product", name: "Gipso", unit: "MACO", quantity: 1 },
      ],
    });
    expect(text).toBe(
      [
        "Entregas — Falta entregar (01/10 a 31/10)",
        "",
        "Quarta-feira, 14/10",
        "335 maços de Gipso",
        "200 maços de Hortênsia",
        "",
        "Quinta-feira, 15/10",
        "1 maço de Gipso",
      ].join("\n"),
    );
    expect(text).not.toMatch(/R\$/);
  });
});
