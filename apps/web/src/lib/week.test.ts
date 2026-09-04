import { describe, expect, it } from "vitest";
import { currentWeekRange, formatShortRange, isWeekRange, shiftWeek } from "./week";

describe("currentWeekRange", () => {
  it("segunda a domingo da semana da data (quinta 2026-09-03)", () => {
    expect(currentWeekRange(new Date(2026, 8, 3))).toEqual({
      from: "2026-08-31",
      to: "2026-09-06",
    });
  });

  it("domingo pertence à semana que começou na segunda anterior", () => {
    expect(currentWeekRange(new Date(2026, 8, 6))).toEqual({
      from: "2026-08-31",
      to: "2026-09-06",
    });
  });

  it("segunda começa a própria semana", () => {
    expect(currentWeekRange(new Date(2026, 8, 7))).toEqual({
      from: "2026-09-07",
      to: "2026-09-13",
    });
  });
});

describe("isWeekRange", () => {
  it("aceita seg→dom de 7 dias", () => {
    expect(isWeekRange("2026-08-31", "2026-09-06")).toBe(true);
  });
  it("rejeita 7 dias começando fora de segunda, ranges maiores e vazios", () => {
    expect(isWeekRange("2026-09-01", "2026-09-07")).toBe(false);
    expect(isWeekRange("2026-08-31", "2026-09-13")).toBe(false);
    expect(isWeekRange("", "")).toBe(false);
  });
});

describe("shiftWeek", () => {
  it("desloca 7 dias para trás e para frente", () => {
    expect(shiftWeek("2026-08-31", "2026-09-06", -1)).toEqual({
      from: "2026-08-24",
      to: "2026-08-30",
    });
    expect(shiftWeek("2026-08-31", "2026-09-06", 1)).toEqual({
      from: "2026-09-07",
      to: "2026-09-13",
    });
  });
});

describe("formatShortRange", () => {
  it("dd/mm – dd/mm", () => {
    expect(formatShortRange("2026-08-31", "2026-09-06")).toBe("31/08 – 06/09");
  });
});
