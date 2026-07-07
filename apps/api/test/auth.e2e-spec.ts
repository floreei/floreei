import request from "supertest";
import {
  bearer,
  firebaseSignUp,
  loginAs,
  registerCompany,
  uniqueDocument,
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
    const document = uniqueDocument();
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Bela Flor", name: "Ana", document })
      .expect(201);
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Bela Flor", name: "Ana", document: uniqueDocument() })
      .expect(409);
  });

  it("valida o payload de provisionamento (nome curto → 400)", async () => {
    const idToken = await firebaseSignUp(uniqueEmail("x"), "Segredo123!");
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "B", name: "A", document: uniqueDocument() })
      .expect(400);
  });

  it("exige CNPJ/CPF no cadastro (sem documento → 400)", async () => {
    const idToken = await firebaseSignUp(uniqueEmail("nodoc"), "Segredo123!");
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Bela Flor", name: "Ana" })
      .expect(400);
    await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Bela Flor", name: "Ana", document: "123" })
      .expect(400);
  });

  it("bloqueia segundo cadastro com o mesmo CNPJ/CPF (com ou sem máscara)", async () => {
    const digits = uniqueDocument();
    await registerCompany(http, { document: digits });
    // Outra conta, mesmo documento agora mascarado → 409.
    const masked = digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
    const idToken = await firebaseSignUp(uniqueEmail("clone"), "Segredo123!");
    const res = await http
      .post("/api/auth/provision")
      .set(bearer(idToken))
      .send({ companyName: "Outra Flor", name: "Bia", document: masked });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain("CNPJ/CPF");
  });

  it("recusa provisionamento sem token do Firebase", async () => {
    await http
      .post("/api/auth/provision")
      .send({ companyName: "Bela Flor", name: "Ana", document: uniqueDocument() })
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
