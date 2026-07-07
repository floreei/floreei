import { describe, expect, it } from "vitest";
import {
  ALL_FEATURES,
  FEATURES,
  PLAN_TIERS,
  planPrice,
  resolveEntitlements,
} from "./entitlements";

describe("resolveEntitlements", () => {
  it("libera TODAS as features durante o trial, independente do plano", () => {
    expect(resolveEntitlements(null, null, "TRIAL").sort()).toEqual(
      [...ALL_FEATURES].sort(),
    );
    expect(
      resolveEntitlements(PLAN_TIERS.ESSENCIAL.features, null, "TRIAL"),
    ).toContain(FEATURES.STORE);
  });

  it("ESSENCIAL (ativo) traz só venda direta + orçamentos", () => {
    const f = resolveEntitlements(PLAN_TIERS.ESSENCIAL.features, null, "ACTIVE");
    expect(f).toEqual([FEATURES.SALES, FEATURES.QUOTES]);
    expect(f).not.toContain(FEATURES.STORE);
    expect(f).not.toContain(FEATURES.INVENTORY);
  });

  it("LOJA (ativo) inclui loja, estoque, buquês e financeiro", () => {
    const f = resolveEntitlements(PLAN_TIERS.LOJA.features, null, "ACTIVE");
    expect(f).toContain(FEATURES.STORE);
    expect(f).toContain(FEATURES.INVENTORY);
    expect(f).toContain(FEATURES.ARRANGEMENTS);
    expect(f).toContain(FEATURES.FINANCE);
    expect(f).not.toContain(FEATURES.REPORTS);
  });

  it("COMPLETO (ativo) libera tudo", () => {
    expect(
      resolveEntitlements(PLAN_TIERS.COMPLETO.features, null, "ACTIVE").sort(),
    ).toEqual([...ALL_FEATURES].sort());
  });

  it("override do backoffice tem precedência sobre o plano", () => {
    // liga uma feature fora do plano
    expect(
      resolveEntitlements(
        PLAN_TIERS.ESSENCIAL.features,
        { STORE: true },
        "ACTIVE",
      ),
    ).toContain(FEATURES.STORE);
    // desliga uma feature do plano
    expect(
      resolveEntitlements(PLAN_TIERS.LOJA.features, { STORE: false }, "ACTIVE"),
    ).not.toContain(FEATURES.STORE);
  });

  it("sem plano e fora do trial → nenhuma feature", () => {
    expect(resolveEntitlements(null, null, "EXPIRED")).toEqual([]);
  });
});

describe("planPrice", () => {
  it("1º usuário incluso; R$16 a partir do 2º", () => {
    expect(planPrice(PLAN_TIERS.ESSENCIAL, 1)).toBe(79); // só a base
    expect(planPrice(PLAN_TIERS.ESSENCIAL, 2)).toBe(79 + 16); // 95
    expect(planPrice(PLAN_TIERS.LOJA, 3)).toBe(149 + 2 * 16); // 181
    expect(planPrice(PLAN_TIERS.COMPLETO, 5)).toBe(229 + 4 * 16); // 293
  });

  it("0 ou 1 usuário custam só a base", () => {
    expect(planPrice(PLAN_TIERS.COMPLETO, 0)).toBe(229);
    expect(planPrice(PLAN_TIERS.COMPLETO, 1)).toBe(229);
  });

  it("aceita definições vindas do banco (preços editados no console)", () => {
    // 99 base + 2 adicionais × 20 = 139
    expect(planPrice({ basePrice: 99, userPrice: 20 }, 3)).toBe(139);
  });
});
