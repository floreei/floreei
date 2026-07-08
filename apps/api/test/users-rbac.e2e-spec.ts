import request from "supertest";
import { loginAs, registerCompany, uniqueEmail,
  inviteMember,
} from "./utils/auth-helper";
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
    const admin = await registerCompany(http, {});
    const opEmail = uniqueEmail("op");

    await inviteMember(http, admin.accessToken, {
      name: "Operador",
      email: opEmail,
    });

    const operator = await loginAs(http, opEmail, "Segredo123!");

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
        email: uniqueEmail("outro"),
        role: "OPERATOR",
      })
      .expect(403);
  });

  it("isola usuários por empresa no endpoint HTTP", async () => {
    const a = await registerCompany(http, {});
    const opaEmail = uniqueEmail("opa");
    await http
      .post("/api/users")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ name: "Op A", email: opaEmail })
      .expect(201);

    const b = await registerCompany(http, {});

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

    expect(emailsA).toEqual([a.email, opaEmail].sort());
    expect(emailsB).toEqual([b.email]);
  });
});
