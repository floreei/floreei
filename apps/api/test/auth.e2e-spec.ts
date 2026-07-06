import request from "supertest";
import {
  bearer,
  firebaseSignUp,
  loginAs,
  registerCompany,
  uniqueEmail,
} from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Auth (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
  });

  it("provisiona empresa + admin a partir de um cadastro no Firebase", async () => {
    const { user, email } = await registerCompany(http, {
      companyName: "Floricultura Bela Flor",
      name: "Ana Souza",
    });

    expect(user).toMatchObject({
      name: "Ana Souza",
      email,
      role: "ADMIN",
      companyName: "Floricultura Bela Flor",
    });
    expect(user.companyId).toBeDefined();
  });

  it("recusa provisionar a mesma conta duas vezes", async () => {
    const idToken = await firebaseSignUp(uniqueEmail("dup"), "Segredo123!");
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Bela Flor", name: "Ana" })
      .expect(201);
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Bela Flor", name: "Ana" })
      .expect(409);
  });

  it("valida o payload de provisionamento (nome curto → 400)", async () => {
    const idToken = await firebaseSignUp(uniqueEmail("x"), "Segredo123!");
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "B", name: "A" })
      .expect(400);
  });

  it("recusa provisionamento sem token do Firebase", async () => {
    await http
      .post("/api/auth/provision")
      .send({ companyName: "Bela Flor", name: "Ana" })
      .expect(401);
  });

  it("faz login (Firebase) e recupera o perfil", async () => {
    const { email, password } = await registerCompany(http, { name: "Log" });
    const { user } = await loginAs(http, email, password);
    expect(user.email).toBe(email);
  });

  it("protege /auth/me e retorna o perfil com token", async () => {
    const { accessToken, email } = await registerCompany(http, {});

    await http.get("/api/auth/me").expect(401);

    const me = await http
      .get("/api/auth/me")
      .set(bearer(accessToken))
      .expect(200);

    expect(me.body.email).toBe(email);
    // Empresa recém-criada começa no período gratuito, com dias restantes.
    expect(me.body.access).toMatchObject({ status: "TRIAL", plan: "TRIAL" });
    expect(me.body.access.trialDaysLeft).toBeGreaterThan(0);
  });

  it("recusa token inválido", async () => {
    await http
      .get("/api/auth/me")
      .set(bearer("nao-e-um-token-valido"))
      .expect(401);
  });
});
