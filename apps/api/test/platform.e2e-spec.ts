import type {
  CompanyDetail,
  CompanyListItem,
  Paginated,
  PlatformOverview,
} from "@sistema-flores/types";
import request from "supertest";
import {
  bearer,
  firebaseSignUp,
  registerCompany,
  uniqueEmail,
  type TestAuth,
} from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Platform console (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let ownerEmail: string;
  let ownerToken: string;
  let companyA: TestAuth;
  let companyB: TestAuth;

  beforeAll(async () => {
    ownerEmail = uniqueEmail("owner");
    // Bootstrap: este e-mail vira OWNER no primeiro acesso ao console.
    process.env.PLATFORM_OWNER_EMAILS = ownerEmail;

    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    await ctx.reset();

    companyA = await registerCompany(http, { companyName: "Floricultura A" });
    companyB = await registerCompany(http, { companyName: "Floricultura B" });
    ownerToken = await firebaseSignUp(ownerEmail, "Segredo123!");

    // Uma venda para a empresa A (métricas de receita/volume).
    const [cust] = (await ctx.dataSource.query(
      `INSERT INTO customers (company_id, name) VALUES ($1, 'Cliente A') RETURNING id`,
      [companyA.user.companyId],
    )) as [{ id: string }];
    await ctx.dataSource.query(
      `INSERT INTO events (company_id, title, customer_id, date, status, sold_value)
       VALUES ($1, 'Venda A', $2, now(), 'CONFIRMED', 1500)`,
      [companyA.user.companyId, cust.id],
    );
  });

  afterAll(async () => {
    delete process.env.PLATFORM_OWNER_EMAILS;
    await ctx.close();
  });

  it("nega o console para quem não é gestor", async () => {
    await http
      .get("/api/admin/overview")
      .set(bearer(companyA.accessToken))
      .expect(403);
  });

  it("nega o console sem token", async () => {
    await http.get("/api/admin/overview").expect(401);
  });

  it("provisiona o OWNER via bootstrap e devolve a sessão", async () => {
    const me = await http
      .get("/api/admin/me")
      .set(bearer(ownerToken))
      .expect(200);
    expect(me.body).toMatchObject({ email: ownerEmail, role: "OWNER" });
  });

  it("visão geral conta empresas por status e receita total", async () => {
    const res = await http
      .get("/api/admin/overview")
      .set(bearer(ownerToken))
      .expect(200);
    const body = res.body as PlatformOverview;
    expect(body.totals.companies).toBe(2);
    expect(body.totals.trial).toBe(2);
    expect(body.totalSales).toBe(1);
    expect(body.totalRevenue).toBe(1500);
  });

  it("lista empresas com status e resumo de uso", async () => {
    const res = await http
      .get("/api/admin/companies")
      .set(bearer(ownerToken))
      .expect(200);
    const body = res.body as Paginated<CompanyListItem>;
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    const list = body.data;
    expect(list).toHaveLength(2);
    const a = list.find((c) => c.id === companyA.user.companyId)!;
    expect(a.status).toBe("TRIAL");
    expect(a.users).toBe(1);
    expect(a.sales).toBe(1);
    expect(a.revenue).toBe(1500);
    expect(a.trialDaysLeft).toBeGreaterThan(0);
  });

  it("filtra a lista por busca de nome", async () => {
    const res = await http
      .get("/api/admin/companies?search=Floricultura A")
      .set(bearer(ownerToken))
      .expect(200);
    const body = res.body as Paginated<CompanyListItem>;
    expect(body.total).toBe(1);
    expect(body.data[0].name).toBe("Floricultura A");
  });

  it("pagina a lista (pageSize=1) preservando o total", async () => {
    const res = await http
      .get("/api/admin/companies?pageSize=1&page=2")
      .set(bearer(ownerToken))
      .expect(200);
    const body = res.body as Paginated<CompanyListItem>;
    expect(body.total).toBe(2);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(1);
    expect(body.totalPages).toBe(2);
    expect(body.data).toHaveLength(1);
  });

  it("detalha uma empresa com métricas e equipe", async () => {
    const res = await http
      .get(`/api/admin/companies/${companyA.user.companyId}`)
      .set(bearer(ownerToken))
      .expect(200);
    const detail = res.body as CompanyDetail;
    expect(detail.metrics.users).toBe(1);
    expect(detail.metrics.sales).toBe(1);
    expect(detail.metrics.revenue).toBe(1500);
    expect(detail.metrics.customers).toBe(1);
    expect(detail.metrics.salesLast7).toBe(1);
    expect(detail.team).toHaveLength(1);
    expect(detail.team[0].role).toBe("ADMIN");
  });

  it("suspende uma empresa e bloqueia o acesso do cliente; reativa e libera", async () => {
    await http
      .post(`/api/admin/companies/${companyA.user.companyId}/suspend`)
      .set(bearer(ownerToken))
      .expect(201);

    const blocked = await http
      .get("/api/auth/me")
      .set(bearer(companyA.accessToken))
      .expect(403);
    expect(blocked.body.code).toBe("COMPANY_SUSPENDED");

    await http
      .post(`/api/admin/companies/${companyA.user.companyId}/reactivate`)
      .set(bearer(ownerToken))
      .expect(201);

    await http
      .get("/api/auth/me")
      .set(bearer(companyA.accessToken))
      .expect(200);
  });

  it("bloqueia o cliente com trial expirado; estender libera o acesso", async () => {
    await ctx.dataSource.query(
      `UPDATE companies SET plan = 'TRIAL', suspended = false, trial_ends_at = now() - interval '1 day' WHERE id = $1`,
      [companyB.user.companyId],
    );

    const blocked = await http
      .get("/api/auth/me")
      .set(bearer(companyB.accessToken))
      .expect(403);
    expect(blocked.body.code).toBe("TRIAL_EXPIRED");

    await http
      .post(`/api/admin/companies/${companyB.user.companyId}/extend-trial`)
      .set(bearer(ownerToken))
      .send({ days: 7 })
      .expect(201);

    await http
      .get("/api/auth/me")
      .set(bearer(companyB.accessToken))
      .expect(200);
  });

  it("define plano e exceções de feature pelo console; reflete no cliente", async () => {
    const res = await http
      .put(`/api/admin/companies/${companyA.user.companyId}/entitlements`)
      .set(bearer(ownerToken))
      .send({ tier: "ESSENCIAL", featureOverrides: { REPORTS: true } })
      .expect(200);
    const detail = res.body as CompanyDetail;
    expect(detail.tier).toBe("ESSENCIAL");
    expect(detail.featureOverrides).toEqual({ REPORTS: true });
    expect(detail.subscription).toBeNull();

    // Empresa liberada manualmente para ver as features fora do trial.
    await http
      .post(`/api/admin/companies/${companyA.user.companyId}/activate`)
      .set(bearer(ownerToken))
      .expect(201);

    const meRes = await http
      .get("/api/auth/me")
      .set(bearer(companyA.accessToken))
      .expect(200);
    const features = meRes.body.access.features as string[];
    // ESSENCIAL (vendas + orçamentos) + a exceção de relatórios ligada.
    expect(features).toContain("SALES");
    expect(features).toContain("REPORTS");
    expect(features).not.toContain("STORE");
  });

  it("rejeita payload inválido de entitlements", async () => {
    await http
      .put(`/api/admin/companies/${companyA.user.companyId}/entitlements`)
      .set(bearer(ownerToken))
      .send({ tier: "INEXISTENTE" })
      .expect(400);
  });

  it("edita as features de um plano e o cliente passa a vê-las", async () => {
    const plans = await http
      .get("/api/admin/plans")
      .set(bearer(ownerToken))
      .expect(200);
    expect(plans.body).toHaveLength(3);
    const essencial = plans.body.find(
      (p: { id: string }) => p.id === "ESSENCIAL",
    );
    expect(essencial.features).toEqual(["SALES", "QUOTES"]);

    // Gestor inclui estoque no Essencial (nada é fixo no código).
    await http
      .put("/api/admin/plans/ESSENCIAL")
      .set(bearer(ownerToken))
      .send({ features: ["SALES", "QUOTES", "INVENTORY"] })
      .expect(200);

    // companyA está no ESSENCIAL (teste anterior) e liberada (ACTIVE).
    const meRes = await http
      .get("/api/auth/me")
      .set(bearer(companyA.accessToken))
      .expect(200);
    expect(meRes.body.access.features).toContain("INVENTORY");

    // Restaura o padrão para não vazar estado.
    await http
      .put("/api/admin/plans/ESSENCIAL")
      .set(bearer(ownerToken))
      .send({ features: ["SALES", "QUOTES"] })
      .expect(200);
  });

  it("plano inexistente e payload inválido são rejeitados", async () => {
    await http
      .put("/api/admin/plans/TURBO")
      .set(bearer(ownerToken))
      .send({ basePrice: 10 })
      .expect(404);
    await http
      .put("/api/admin/plans/ESSENCIAL")
      .set(bearer(ownerToken))
      .send({ features: ["NAO_EXISTE"] })
      .expect(400);
  });

  it("gestores: OWNER convida SUPPORT; SUPPORT vê mas não convida", async () => {
    const admins = await http
      .get("/api/admin/admins")
      .set(bearer(ownerToken))
      .expect(200);
    expect(
      admins.body.some(
        (a: { email: string; role: string }) =>
          a.email === ownerEmail && a.role === "OWNER",
      ),
    ).toBe(true);

    const supportEmail = uniqueEmail("support");
    await http
      .post("/api/admin/admins")
      .set(bearer(ownerToken))
      .send({ email: supportEmail, name: "Suporte", role: "SUPPORT" })
      .expect(201);

    const supportToken = await firebaseSignUp(supportEmail, "Segredo123!");
    await http
      .get("/api/admin/overview")
      .set(bearer(supportToken))
      .expect(200);
    await http
      .post("/api/admin/admins")
      .set(bearer(supportToken))
      .send({ email: uniqueEmail("x2"), name: "X", role: "SUPPORT" })
      .expect(403);
  });
});
