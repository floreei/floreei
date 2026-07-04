import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatPercent } from "./utils";

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
