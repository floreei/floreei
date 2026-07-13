import { describe, expect, it } from "vitest";
import {
  cn,
  currentMonthRange,
  formatCurrency,
  formatDate,
  formatPercent,
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
