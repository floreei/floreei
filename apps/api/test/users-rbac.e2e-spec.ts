import request from "supertest";
import { loginAs, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Usuários + RBAC (e2e)", () => {
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

  it("admin cria operador; operador não pode criar usuários (403)", async () => {
    const admin = await registerCompany(http, { email: "admin@a.com" });

    await http
      .post("/api/users")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        name: "Operador",
        email: "op@a.com",
        password: "segredo123",
        role: "OPERATOR",
      })
      .expect(201);

    const operator = await loginAs(http, "op@a.com", "segredo123");

    // operador pode listar
    await http
      .get("/api/users")
      .set("Authorization", `Bearer ${operator.accessToken}`)
      .expect(200);

    // mas não pode criar
    await http
      .post("/api/users")
      .set("Authorization", `Bearer ${operator.accessToken}`)
      .send({
        name: "Outro",
        email: "outro@a.com",
        password: "segredo123",
        role: "OPERATOR",
      })
      .expect(403);
  });

  it("isola usuários por empresa no endpoint HTTP", async () => {
    const a = await registerCompany(http, { email: "admin@empresaA.com" });
    await http
      .post("/api/users")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ name: "Op A", email: "opa@a.com", password: "segredo123" })
      .expect(201);

    const b = await registerCompany(http, { email: "admin@empresaB.com" });

    const listA = await http
      .get("/api/users")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(200);
    const listB = await http
      .get("/api/users")
      .set("Authorization", `Bearer ${b.accessToken}`)
      .expect(200);

    const emailsA = listA.body.map((u: { email: string }) => u.email).sort();
    const emailsB = listB.body.map((u: { email: string }) => u.email);

    expect(emailsA).toEqual(["admin@empresaa.com", "opa@a.com"]);
    expect(emailsB).toEqual(["admin@empresab.com"]);
  });
});
