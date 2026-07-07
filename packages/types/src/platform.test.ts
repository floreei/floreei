import { describe, expect, it } from "vitest";
import {
  daysSince,
  resolveCompanyAccess,
  type CompanyAccess,
} from "./platform";

const now = new Date("2026-07-05T12:00:00Z");
const iso = (d: string) => d;

describe("resolveCompanyAccess", () => {
  it("suspende com precedência sobre tudo", () => {
    const access: CompanyAccess = {
      plan: "ACTIVE",
      suspended: true,
      trialEndsAt: null,
    };
    expect(resolveCompanyAccess(access, now)).toEqual({
      status: "SUSPENDED",
      allowed: false,
      trialDaysLeft: null,
      graceDaysLeft: null,
    });
  });

  it("libera plano ACTIVE sem olhar prazo", () => {
    const access: CompanyAccess = {
      plan: "ACTIVE",
      suspended: false,
      trialEndsAt: iso("2000-01-01T00:00:00Z"),
    };
    const r = resolveCompanyAccess(access, now);
    expect(r.status).toBe("ACTIVE");
    expect(r.allowed).toBe(true);
    expect(r.trialDaysLeft).toBeNull();
  });

  it("conta dias restantes no trial (arredonda p/ cima)", () => {
    const access: CompanyAccess = {
      plan: "TRIAL",
      suspended: false,
      trialEndsAt: iso("2026-07-10T18:00:00Z"), // ~5,25 dias
    };
    const r = resolveCompanyAccess(access, now);
    expect(r.status).toBe("TRIAL");
    expect(r.allowed).toBe(true);
    expect(r.trialDaysLeft).toBe(6);
  });

  it("expira quando o trial acabou", () => {
    const access: CompanyAccess = {
      plan: "TRIAL",
      suspended: false,
      trialEndsAt: iso("2026-07-01T00:00:00Z"),
    };
    expect(resolveCompanyAccess(access, now)).toEqual({
      status: "EXPIRED",
      allowed: false,
      trialDaysLeft: 0,
      graceDaysLeft: null,
    });
  });

  it("expira quando TRIAL sem trialEndsAt", () => {
    const access: CompanyAccess = {
      plan: "TRIAL",
      suspended: false,
      trialEndsAt: null,
    };
    expect(resolveCompanyAccess(access, now).status).toBe("EXPIRED");
  });

  const subscribed = (
    overrides: Partial<CompanyAccess> = {},
  ): CompanyAccess => ({
    plan: "TRIAL",
    suspended: false,
    trialEndsAt: iso("2026-06-01T00:00:00Z"), // trial já vencido
    subscriptionStatus: "AUTHORIZED",
    paymentFailedAt: null,
    ...overrides,
  });

  it("assinatura AUTHORIZED libera mesmo com trial vencido", () => {
    const r = resolveCompanyAccess(subscribed(), now);
    expect(r.status).toBe("ACTIVE");
    expect(r.allowed).toBe(true);
    expect(r.graceDaysLeft).toBeNull();
  });

  it("pagamento pendente dentro da carência libera com aviso", () => {
    const r = resolveCompanyAccess(
      subscribed({ paymentFailedAt: iso("2026-07-03T12:00:00Z") }), // há 2 dias
      now,
    );
    expect(r.allowed).toBe(true);
    expect(r.graceDaysLeft).toBe(3); // 5 dias de carência − 2 corridos
  });

  it("pagamento pendente além da carência bloqueia (PAYMENT_OVERDUE)", () => {
    const r = resolveCompanyAccess(
      subscribed({ paymentFailedAt: iso("2026-06-25T12:00:00Z") }), // há 10 dias
      now,
    );
    expect(r).toEqual({
      status: "PAYMENT_OVERDUE",
      allowed: false,
      trialDaysLeft: null,
      graceDaysLeft: null,
    });
  });

  it("assinatura cancelada tem carência e depois cai para EXPIRED", () => {
    const within = resolveCompanyAccess(
      subscribed({
        subscriptionStatus: "CANCELLED",
        paymentFailedAt: iso("2026-07-04T12:00:00Z"),
      }),
      now,
    );
    expect(within.allowed).toBe(true);

    const past = resolveCompanyAccess(
      subscribed({
        subscriptionStatus: "CANCELLED",
        paymentFailedAt: iso("2026-06-20T12:00:00Z"),
      }),
      now,
    );
    expect(past.status).toBe("EXPIRED");
    expect(past.allowed).toBe(false);
  });

  it("assinatura PENDING não libera nada (segue trial/EXPIRED)", () => {
    const r = resolveCompanyAccess(
      subscribed({ subscriptionStatus: "PENDING" }),
      now,
    );
    expect(r.status).toBe("EXPIRED");
  });
});

describe("daysSince", () => {
  it("retorna null quando nunca acessou", () => {
    expect(daysSince(null, now)).toBeNull();
  });

  it("conta dias inteiros desde o momento", () => {
    expect(daysSince("2026-07-01T12:00:00Z", now)).toBe(4);
  });
});
