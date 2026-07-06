import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Entitlements / feature gating (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let companyId: string;
  const auth = () => bearer(token);

  const setCompany = (sql: string) =>
    ctx.dataSource.query(`UPDATE companies SET ${sql} WHERE id = $1`, [
      companyId,
    ]);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "plano" });
    token = reg.accessToken;
    companyId = reg.user.companyId;
  });
  afterAll(async () => {
    await ctx.close();
  });

  it("no trial, os módulos pagos ficam liberados", async () => {
    await setCompany("plan = 'TRIAL', tier = NULL, feature_overrides = '{}'");
    await http.get("/api/arrangements").set(auth()).expect(200);
  });

  it("plano ESSENCIAL bloqueia feature fora do plano (403 FEATURE_LOCKED)", async () => {
    await setCompany(
      "plan = 'ACTIVE', tier = 'ESSENCIAL', feature_overrides = '{}'",
    );
    const res = await http.get("/api/arrangements").set(auth());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FEATURE_LOCKED");
    expect(res.body.feature).toBe("ARRANGEMENTS");
    // Módulo do núcleo (clientes) continua acessível.
    await http.get("/api/customers").set(auth()).expect(200);
  });

  it("override do backoffice reabre a feature", async () => {
    await setCompany(
      `plan = 'ACTIVE', tier = 'ESSENCIAL', feature_overrides = '{"ARRANGEMENTS": true}'`,
    );
    await http.get("/api/arrangements").set(auth()).expect(200);
  });

  it("/auth/me devolve tier + features do plano", async () => {
    await setCompany("plan = 'ACTIVE', tier = 'LOJA', feature_overrides = '{}'");
    const res = await http.get("/api/auth/me").set(auth()).expect(200);
    expect(res.body.access.tier).toBe("LOJA");
    expect(res.body.access.features).toContain("STORE");
    expect(res.body.access.features).not.toContain("REPORTS");
  });
});
