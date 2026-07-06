import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Relatórios (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let productId: string;
  let customerId: string;
  let supplierId: string;

  const auth = () => bearer(token);
  const day = "2026-06-15";

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@rep.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    const category = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Rosas" })
      .expect(201);
    productId = (
      await http
        .post("/api/products")
        .set(auth())
        .send({ categoryId: category.body.id, name: "Rosa", defaultSalePrice: 10 })
        .expect(201)
    ).body.id;
    customerId = (
      await http.post("/api/customers").set(auth()).send({ name: "Ana" }).expect(201)
    ).body.id;
    supplierId = (
      await http.post("/api/suppliers").set(auth()).send({ name: "Ceasa" }).expect(201)
    ).body.id;
  });

  it("consolida receita, custo, lucro e rankings do período", async () => {
    // Compra de 100 (custo)
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 25, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    // Orçamento -> evento (venda)
    const quote = await http
      .post("/api/quotes")
      .set(auth())
      .send({
        customerId,
        items: [
          { productId, description: "Rosa", quantity: 30, unit: "MACO", purchasePrice: 4, salePrice: 10 },
        ],
      })
      .expect(201);
    await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(auth())
      .send({ title: "Casamento Ana", date: day })
      .expect(201);

    const res = await http
      .get("/api/reports?from=2026-06-01&to=2026-06-30")
      .set(auth())
      .expect(200);

    expect(res.body.summary.revenue).toBe(300); // 30 * 10
    expect(res.body.summary.cogs).toBe(120); // custo do vendido: 30 * 4
    expect(res.body.summary.purchasesCost).toBe(100); // compras (caixa): 25 * 4
    expect(res.body.summary.grossProfit).toBe(180); // receita − COGS
    expect(res.body.summary.eventsCount).toBe(1);

    expect(res.body.topProducts[0]).toMatchObject({
      name: "Rosa",
      quantity: 30,
      revenue: 300,
      profit: 180, // 30 * (10-4)
    });
    expect(res.body.suppliers[0]).toMatchObject({ name: "Ceasa", total: 100 });
    expect(res.body.customers[0]).toMatchObject({ name: "Ana", total: 300 });

    // Série mensal do período (para o gráfico Receita × Lucro).
    expect(res.body.monthly).toEqual([
      { ym: "2026-06", revenue: 300, cogs: 120, grossProfit: 180 },
    ]);
  });

  it("período sem dados retorna zeros", async () => {
    const res = await http
      .get("/api/reports?from=2030-01-01&to=2030-01-31")
      .set(auth())
      .expect(200);
    expect(res.body.summary.revenue).toBe(0);
    expect(res.body.topProducts).toHaveLength(0);
  });
});
