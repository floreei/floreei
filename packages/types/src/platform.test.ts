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
});

describe("daysSince", () => {
  it("retorna null quando nunca acessou", () => {
    expect(daysSince(null, now)).toBeNull();
  });

  it("conta dias inteiros desde o momento", () => {
    expect(daysSince("2026-07-01T12:00:00Z", now)).toBe(4);
  });
});
