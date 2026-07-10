import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Dashboard (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;

  const thisMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@dash.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    const customer = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Cliente Dash" })
      .expect(201);
    customerId = customer.body.id;
  });

  it("resume eventos do mês, receita, contas a receber e pendências", async () => {
    await http
      .post("/api/events")
      .set(bearer(token))
      .send({
        customerId,
        title: "Evento do mês",
        date: thisMonth(),
        soldValue: 1000,
        receivedValue: 400,
        estimatedProfit: 350,
      })
      .expect(201);

    await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: [] })
      .expect(201);

    const res = await http
      .get("/api/dashboard/summary")
      .set(bearer(token))
      .expect(200);

    expect(res.body.eventsThisMonth).toBe(1);
    expect(res.body.revenueThisMonth).toBe(1000);
    expect(res.body.estimatedProfitThisMonth).toBe(350);
    expect(res.body.accountsReceivable).toBe(600);
    expect(res.body.pendingQuotes).toBe(1);
    expect(res.body.revenueSeries).toHaveLength(6);
    expect(Array.isArray(res.body.upcomingEvents)).toBe(true);
    expect(Array.isArray(res.body.recentQuotes)).toBe(true);
  });

  it("exige autenticação", async () => {
    await http.get("/api/dashboard/summary").expect(401);
  });

  it("primeiros passos refletem a ordem do negócio (categoria→insumo→…)", async () => {
    const steps = () =>
      http.get("/api/dashboard/first-steps").set(bearer(token)).expect(200);

    // beforeEach limpou os dados de negócio e criou um cliente.
    let res = await steps();
    expect(res.body).toMatchObject({
      hasCategory: false,
      hasProduct: false,
      hasCustomer: true,
      hasArrangement: false,
      hasSupplier: false,
      hasPurchase: false,
      hasRetailSale: false,
      hasWholesaleSale: false,
    });

    // Categoria → insumo (a base).
    const cat = await http
      .post("/api/categories")
      .set(bearer(token))
      .send({ name: "Rosas" })
      .expect(201);
    const product = await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: cat.body.id, name: "Rosa", defaultSalePrice: 10 })
      .expect(201);

    // Varejo: buquê + venda direta (evento manual é RETAIL).
    await http
      .post("/api/arrangements")
      .set(bearer(token))
      .send({ name: "Buquê", salePrice: 50, items: [{ productId: product.body.id, quantity: 3 }] })
      .expect(201);
    await http
      .post("/api/events")
      .set(bearer(token))
      .send({ customerId, title: "Venda direta", date: thisMonth(), soldValue: 120 })
      .expect(201);

    // Atacado: fornecedor → compra → venda no atacado.
    const supplier = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Ceasa" })
      .expect(201);
    await http
      .post("/api/purchases")
      .set(bearer(token))
      .send({
        supplierId: supplier.body.id,
        date: thisMonth(),
        items: [{ productId: product.body.id, description: "Rosa", quantity: 10, unit: "UNIDADE", unitPrice: 4 }],
      })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ channel: "WHOLESALE", items: [{ productId: product.body.id, quantity: 2, unitSalePrice: 8 }] })
      .expect(201);

    res = await steps();
    expect(res.body).toMatchObject({
      hasCategory: true,
      hasProduct: true,
      hasArrangement: true,
      hasSupplier: true,
      hasPurchase: true,
      hasRetailSale: true,
      hasWholesaleSale: true,
    });
  });
});
