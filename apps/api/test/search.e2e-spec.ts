import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Busca global (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;

  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@busca.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("encontra clientes, eventos e produtos por texto", async () => {
    const customer = await http
      .post("/api/customers")
      .set(auth())
      .send({ name: "Ana Decoração" })
      .expect(201);
    await http
      .post("/api/events")
      .set(auth())
      .send({ customerId: customer.body.id, title: "Casamento Ana", date: "2026-07-01" })
      .expect(201);
    const category = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Rosas" })
      .expect(201);
    await http
      .post("/api/products")
      .set(auth())
      .send({ categoryId: category.body.id, name: "Anabela Rosa" })
      .expect(201);

    const res = await http.get("/api/search?q=ana").set(auth()).expect(200);
    const types = res.body.map((r: { type: string }) => r.type);

    expect(types).toContain("customer");
    expect(types).toContain("event");
    expect(types).toContain("product");

    const event = res.body.find((r: { type: string }) => r.type === "event");
    expect(event.href).toMatch(/^\/eventos\//);
    expect(event.label).toBe("Casamento Ana");
  });

  it("isola a busca por empresa", async () => {
    await http
      .post("/api/customers")
      .set(auth())
      .send({ name: "Cliente Secreto" })
      .expect(201);

    const other = await registerCompany(http, { email: "outro@busca.com" });
    const res = await http
      .get("/api/search?q=secreto")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(res.body).toHaveLength(0);
  });
});
