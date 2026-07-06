import { describe, expect, it } from "vitest";
import {
  ALL_FEATURES,
  FEATURES,
  planPrice,
  resolveEntitlements,
} from "./entitlements";

describe("resolveEntitlements", () => {
  it("libera TODAS as features durante o trial, independente do tier", () => {
    expect(resolveEntitlements(null, null, "TRIAL").sort()).toEqual(
      [...ALL_FEATURES].sort(),
    );
    expect(resolveEntitlements("ESSENCIAL", null, "TRIAL")).toContain(
      FEATURES.STORE,
    );
  });

  it("ESSENCIAL (ativo) traz só venda direta + orçamentos", () => {
    const f = resolveEntitlements("ESSENCIAL", null, "ACTIVE");
    expect(f).toEqual([FEATURES.SALES, FEATURES.QUOTES]);
    expect(f).not.toContain(FEATURES.STORE);
    expect(f).not.toContain(FEATURES.INVENTORY);
  });

  it("LOJA (ativo) inclui loja, estoque, buquês e financeiro", () => {
    const f = resolveEntitlements("LOJA", null, "ACTIVE");
    expect(f).toContain(FEATURES.STORE);
    expect(f).toContain(FEATURES.INVENTORY);
    expect(f).toContain(FEATURES.ARRANGEMENTS);
    expect(f).toContain(FEATURES.FINANCE);
    expect(f).not.toContain(FEATURES.REPORTS);
  });

  it("COMPLETO (ativo) libera tudo", () => {
    expect(resolveEntitlements("COMPLETO", null, "ACTIVE").sort()).toEqual(
      [...ALL_FEATURES].sort(),
    );
  });

  it("override do backoffice tem precedência sobre o tier", () => {
    // liga uma feature fora do tier
    expect(
      resolveEntitlements("ESSENCIAL", { STORE: true }, "ACTIVE"),
    ).toContain(FEATURES.STORE);
    // desliga uma feature do tier
    expect(
      resolveEntitlements("LOJA", { STORE: false }, "ACTIVE"),
    ).not.toContain(FEATURES.STORE);
  });

  it("sem tier e fora do trial → nenhuma feature", () => {
    expect(resolveEntitlements(null, null, "EXPIRED")).toEqual([]);
  });
});

describe("planPrice", () => {
  it("soma R$16 por usuário ativo sobre a base do plano", () => {
    expect(planPrice("ESSENCIAL", 1)).toBe(79 + 16); // 95
    expect(planPrice("ESSENCIAL", 2)).toBe(79 + 2 * 16); // 111
    expect(planPrice("LOJA", 3)).toBe(149 + 3 * 16); // 197
    expect(planPrice("COMPLETO", 5)).toBe(229 + 5 * 16); // 309
  });

  it("nenhum usuário incluso na base", () => {
    expect(planPrice("COMPLETO", 0)).toBe(229);
  });
});
