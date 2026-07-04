import request from "supertest";
import { bearer, loginAs, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Clientes (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
    const auth = await registerCompany(http, { email: "dono@flor.com" });
    token = auth.accessToken;
  });

  it("exige autenticação", async () => {
    await http.get("/api/customers").expect(401);
  });

  it("cria, busca, atualiza e remove um cliente", async () => {
    const created = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Maria Noiva", whatsapp: "11999998888", email: "" })
      .expect(201);

    expect(created.body.id).toBeDefined();
    expect(created.body.name).toBe("Maria Noiva");
    expect(created.body.email).toBeNull();

    const id = created.body.id;

    const list = await http.get("/api/customers").set(bearer(token)).expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].name).toBe("Maria Noiva");

    const updated = await http
      .patch(`/api/customers/${id}`)
      .set(bearer(token))
      .send({ name: "Maria Silva" })
      .expect(200);
    expect(updated.body.name).toBe("Maria Silva");

    await http.delete(`/api/customers/${id}`).set(bearer(token)).expect(204);
    await http.get(`/api/customers/${id}`).set(bearer(token)).expect(404);
  });

  it("filtra por busca", async () => {
    await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Ana Hortência" })
      .expect(201);
    await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Bruno Lima" })
      .expect(201);

    const res = await http
      .get("/api/customers?search=ana")
      .set(bearer(token))
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].name).toBe("Ana Hortência");
  });

  it("não enxerga clientes de outra empresa", async () => {
    await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Cliente Empresa A" })
      .expect(201);

    const other = await registerCompany(http, { email: "dono@outra.com" });
    const list = await http
      .get("/api/customers")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(list.body.total).toBe(0);
  });

  it("apenas ADMIN pode excluir", async () => {
    const created = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Para excluir" })
      .expect(201);

    await http
      .post("/api/users")
      .set(bearer(token))
      .send({ name: "Op", email: "op@flor.com", password: "segredo123" })
      .expect(201);
    const operator = await loginAs(http, "op@flor.com", "segredo123");

    await http
      .delete(`/api/customers/${created.body.id}`)
      .set(bearer(operator.accessToken))
      .expect(403);
  });
});
