import request from "supertest";
import {
  bearer,
  firebaseSignUp,
  loginAs,
  registerCompany,
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
    const { user } = await registerCompany(http, {
      companyName: "Floricultura Bela Flor",
      name: "Ana Souza",
      email: "ana@belaflor.com",
    });

    expect(user).toMatchObject({
      name: "Ana Souza",
      email: "ana@belaflor.com",
      role: "ADMIN",
      companyName: "Floricultura Bela Flor",
    });
    expect(user.companyId).toBeDefined();
  });

  it("recusa provisionar a mesma conta duas vezes", async () => {
    const idToken = await firebaseSignUp("dup@belaflor.com", "segredo123");
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
    const idToken = await firebaseSignUp("x@belaflor.com", "segredo123");
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
    await registerCompany(http, {
      email: "login@belaflor.com",
      password: "segredo123",
    });
    const { user } = await loginAs(http, "login@belaflor.com", "segredo123");
    expect(user.email).toBe("login@belaflor.com");
  });

  it("protege /auth/me e retorna o perfil com token", async () => {
    const { accessToken } = await registerCompany(http, {
      email: "me@belaflor.com",
    });

    await http.get("/api/auth/me").expect(401);

    const me = await http
      .get("/api/auth/me")
      .set(bearer(accessToken))
      .expect(200);

    expect(me.body.email).toBe("me@belaflor.com");
  });

  it("recusa token inválido", async () => {
    await http
      .get("/api/auth/me")
      .set(bearer("nao-e-um-token-valido"))
      .expect(401);
  });
});
