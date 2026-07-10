import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("NCM — busca e validação (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  const seedNcm = (
    code: string,
    description: string,
    hierarchicalDescription: string,
    active = true,
  ) =>
    ctx.dataSource.query(
      `INSERT INTO "ncm" ("code", "description", "hierarchical_description", "active")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("code") DO UPDATE SET
         "description" = EXCLUDED."description",
         "hierarchical_description" = EXCLUDED."hierarchical_description",
         "active" = EXCLUDED."active"`,
      [code, description, hierarchicalDescription, active],
    );

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "ncm" });
    token = reg.accessToken;

    await seedNcm(
      "06031100",
      "Rosas",
      "Plantas vivas e produtos de floricultura. > Flores e botões de flores, cortados, para buquês. > Rosas",
    );
    await seedNcm(
      "06031900",
      "Outras",
      "Plantas vivas e produtos de floricultura. > Flores e botões de flores, cortados, para buquês. > Outras",
    );
    await seedNcm(
      "12345678",
      "Código antigo",
      "Capítulo teste > Código antigo",
      false,
    );
  });

  afterAll(async () => {
    await ctx.close();
  });

  it("busca por prefixo numérico", async () => {
    const res = await http
      .get("/api/ncm/search")
      .query({ q: "0603" })
      .set(auth())
      .expect(200);
    const codes = res.body.map((e: { code: string }) => e.code);
    expect(codes).toEqual(expect.arrayContaining(["06031100", "06031900"]));
    expect(codes).not.toContain("12345678");
  });

  it("busca por texto tolerante a acento/erro, pela descrição hierárquica", async () => {
    const res = await http
      .get("/api/ncm/search")
      .query({ q: "rosas" })
      .set(auth())
      .expect(200);
    const codes = res.body.map((e: { code: string }) => e.code);
    expect(codes[0]).toBe("06031100");
  });

  it("valida código existente e vigente", async () => {
    const res = await http
      .get("/api/ncm/06031100/validate")
      .set(auth())
      .expect(200);
    expect(res.body).toMatchObject({ code: "06031100", valid: true, reason: null });
    expect(res.body.entry.description).toBe("Rosas");
  });

  it("rejeita código inexistente", async () => {
    const res = await http
      .get("/api/ncm/99999999/validate")
      .set(auth())
      .expect(200);
    expect(res.body).toMatchObject({ valid: false, entry: null });
    expect(res.body.reason).toMatch(/não encontrado/i);
  });

  it("rejeita código fora de vigência", async () => {
    const res = await http
      .get("/api/ncm/12345678/validate")
      .set(auth())
      .expect(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.reason).toMatch(/vigente/i);
  });

  it("rejeita código que não tem 8 dígitos", async () => {
    const res = await http.get("/api/ncm/0603/validate").set(auth()).expect(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.reason).toMatch(/8 dígitos/i);
  });

  it("lista sugestões curadas (semeadas pela migração)", async () => {
    const res = await http.get("/api/ncm/suggestions").set(auth()).expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("term");
    expect(res.body[0]).toHaveProperty("ncmCode");
  });

  it("bloqueia /ncm/sync sem token de serviço", async () => {
    await http.post("/api/ncm/sync").expect(401);
  });

  it("bloqueia /ncm/sync com token de serviço incorreto", async () => {
    await http
      .post("/api/ncm/sync")
      .set("Authorization", "Bearer token-errado")
      .expect(401);
  });
});
