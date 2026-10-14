import { describe, expect, it } from "vitest";
import {
  cn,
  currentMonthRange,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateWithWeekday,
  formatPercent,
  formatWeekdayShort,
  todayLocalISO,
} from "./utils";

// Intl pode usar espaço comum, NBSP (U+00A0) ou narrow NBSP (U+202F) conforme a versão do ICU.
const normalizeSpaces = (s: string) => s.replace(/[   \s]/g, " ");

describe("cn", () => {
  it("resolve conflitos de classes do tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("formatCurrency", () => {
  it("formata em BRL", () => {
    expect(normalizeSpaces(formatCurrency(1234.5))).toBe("R$ 1.234,50");
  });
});

describe("formatPercent", () => {
  it("formata percentual com 1 casa", () => {
    expect(normalizeSpaces(formatPercent(42.5))).toBe("42,5%");
  });
});

describe("formatDate", () => {
  it("formata AAAA-MM-DD no padrão pt-BR", () => {
    expect(formatDate("2026-07-10")).toBe("10/07/2026");
  });

  it("devolve travessão quando vazio", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatWeekdayShort", () => {
  it("abrevia o dia da semana sem ponto final e mostra dia/mês", () => {
    // 2026-10-14 é uma quarta-feira.
    expect(formatWeekdayShort("2026-10-14")).toBe("qua 14/10");
  });

  it("funciona na virada de mês e no domingo", () => {
    // 2026-11-01 é um domingo.
    expect(formatWeekdayShort("2026-11-01")).toBe("dom 01/11");
  });
});

describe("formatDateWithWeekday", () => {
  it("escreve o dia da semana por extenso com a data completa", () => {
    expect(formatDateWithWeekday("2026-10-14")).toBe("quarta-feira, 14/10/2026");
  });

  it("segunda-feira sai com inicial minúscula, como no pt-BR", () => {
    // 2026-10-12 é uma segunda-feira.
    expect(formatDateWithWeekday("2026-10-12")).toBe("segunda-feira, 12/10/2026");
  });
});

describe("formatDateTime", () => {
  it("formata um instante ISO (UTC) como data e hora no fuso local", () => {
    const instant = new Date(2026, 9, 14, 15, 7); // 14/10/2026 15:07 local
    expect(normalizeSpaces(formatDateTime(instant.toISOString()))).toBe(
      "14/10/2026 às 15:07",
    );
  });

  it("devolve travessão quando vazio", () => {
    expect(formatDateTime(null)).toBe("—");
  });
});

describe("todayLocalISO", () => {
  it("devolve a data de hoje no formato AAAA-MM-DD", () => {
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("currentMonthRange", () => {
  it("vai do dia 1 ao ÚLTIMO dia do mês atual", () => {
    const { from, to } = currentMonthRange();
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    expect(from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(to).toMatch(new RegExp(`^\\d{4}-\\d{2}-${String(lastDay).padStart(2, "0")}$`));
    expect(from.slice(0, 7)).toBe(to.slice(0, 7));
  });
});
