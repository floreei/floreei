import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Fornecedores — lista enriquecida e ranking (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  const thisMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-10`;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "forn@insights.com" }))
      .accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("lista traz total comprado, nº de compras e última compra por fornecedor", async () => {
    const supplier = await http
      .post("/api/suppliers")
      .set(auth())
      .send({ name: "Ceasa" })
      .expect(201);
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId: supplier.body.id,
        date: thisMonth(),
        items: [{ description: "Rosas", quantity: 10, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    const list = await http.get("/api/suppliers").set(auth()).expect(200);
    const row = list.body.data.find(
      (s: { id: string }) => s.id === supplier.body.id,
    );
    expect(row.totalPurchased).toBe(40);
    expect(row.purchasesCount).toBe(1);
    expect(row.lastPurchaseAt).toBe(thisMonth());
  });

  it("ranking ordena fornecedores por total gasto", async () => {
    const a = await http
      .post("/api/suppliers")
      .set(auth())
      .send({ name: "Grande" })
      .expect(201);
    const b = await http
      .post("/api/suppliers")
      .set(auth())
      .send({ name: "Pequeno" })
      .expect(201);
    await http.post("/api/purchases").set(auth()).send({
      supplierId: a.body.id,
      date: thisMonth(),
      items: [{ description: "x", quantity: 100, unit: "MACO", unitPrice: 5 }],
    });
    await http.post("/api/purchases").set(auth()).send({
      supplierId: b.body.id,
      date: thisMonth(),
      items: [{ description: "y", quantity: 1, unit: "MACO", unitPrice: 5 }],
    });

    const res = await http.get("/api/suppliers/ranking").set(auth()).expect(200);
    expect(res.body[0].name).toBe("Grande");
    expect(res.body[0].total).toBeGreaterThan(res.body[1].total);
  });
});
