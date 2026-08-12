import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Vendas — insights e filtro de pagamento (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "insights" });
    token = reg.accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("GET /events/insights devolve as 4 listas sem erro de SQL", async () => {
    // Uma venda avulsa paga garante que as queries rodam com dados reais.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 150, title: "Venda avulsa", channel: "RETAIL" })
      .expect(201);

    const res = await http.get("/api/events/insights").set(auth()).expect(200);
    expect(res.body).toMatchObject({
      topItems: expect.any(Array),
      idleItems: expect.any(Array),
      topCustomers: expect.any(Array),
      atRiskCustomers: expect.any(Array),
      from: expect.any(String),
      to: expect.any(String),
    });
  });

  it("lista cliente em risco com data ISO válida (compra em mês anterior)", async () => {
    const lastMonth = () => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`;
    };
    const customer = await http
      .post("/api/customers")
      .set(auth())
      .send({ name: "Sumido" })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        amount: 300,
        title: "Compra antiga",
        channel: "RETAIL",
        customerId: customer.body.id,
        date: lastMonth(),
      })
      .expect(201);

    // Insights do mês atual: o cliente não comprou este mês → em risco.
    const res = await http.get("/api/events/insights").set(auth()).expect(200);
    const atRisk = res.body.atRiskCustomers.find(
      (c: { id: string }) => c.id === customer.body.id,
    );
    expect(atRisk).toBeTruthy();
    expect(atRisk.lastPurchaseAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(atRisk.total).toBe(300);
  });

  it("insights filtram por canal (atacado vê só vendas do atacado)", async () => {
    const cat = await (
      await http.post("/api/categories").set(auth()).send({ name: "Rosas" }).expect(201)
    ).body;
    const mk = async (name: string) =>
      (
        await http
          .post("/api/products")
          .set(auth())
          .send({ categoryId: cat.id, name, unit: "MACO", defaultSalePrice: 10 })
          .expect(201)
      ).body.id;
    const atacadoProd = await mk("Rosa Atacado");
    const varejoProd = await mk("Rosa Varejo");

    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", items: [{ productId: atacadoProd, quantity: 5, unitSalePrice: 8 }] })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "RETAIL", items: [{ productId: varejoProd, quantity: 3, unitSalePrice: 12 }] })
      .expect(201);

    const wholesale = await http
      .get("/api/events/insights")
      .query({ channel: "WHOLESALE" })
      .set(auth())
      .expect(200);
    const wsIds = wholesale.body.topItems.map((i: { id: string }) => i.id);
    expect(wsIds).toContain(atacadoProd);
    expect(wsIds).not.toContain(varejoProd);

    const retail = await http
      .get("/api/events/insights")
      .query({ channel: "RETAIL" })
      .set(auth())
      .expect(200);
    const rtIds = retail.body.topItems.map((i: { id: string }) => i.id);
    expect(rtIds).toContain(varejoProd);
    expect(rtIds).not.toContain(atacadoProd);
  });

  it("filtra vendas por situação de pagamento (paga vs pendente)", async () => {
    // Uma venda quitada (recebe o total) e uma a prazo (sem recebimento).
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 100, title: "Paga", channel: "RETAIL" })
      .expect(201);
    await http
      .post(`/api/finance/events/${sale.body.id}/payments`)
      .set(auth())
      .send({ amount: 100, method: "PIX" })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 200, title: "A prazo", channel: "RETAIL" })
      .expect(201);

    const paid = await http
      .get("/api/events")
      .query({ channel: "RETAIL", paymentStatus: "paid" })
      .set(auth())
      .expect(200);
    expect(paid.body.data.length).toBe(1);
    expect(paid.body.data[0].title).toBe("Paga");

    const pending = await http
      .get("/api/events")
      .query({ channel: "RETAIL", paymentStatus: "pending" })
      .set(auth())
      .expect(200);
    expect(pending.body.data.length).toBe(1);
    expect(pending.body.data[0].title).toBe("A prazo");
  });

  it("pendingDeliveries agrega itens não entregues por cliente", async () => {
    const cat = await (
      await http.post("/api/categories").set(auth()).send({ name: "Rosas P" }).expect(201)
    ).body;
    const prod = await (
      await http
        .post("/api/products")
        .set(auth())
        .send({ categoryId: cat.id, name: "Rosa Colombiana", unit: "MACO", defaultSalePrice: 30 })
        .expect(201)
    ).body;
    const customer = await (
      await http.post("/api/customers").set(auth()).send({ name: "Mercado Central" }).expect(201)
    ).body;

    // Pendente: 5 maços para o Mercado Central.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        customerId: customer.id,
        items: [{ productId: prod.id, quantity: 5, unitSalePrice: 25 }],
      })
      .expect(201);
    // Entregue: não pode aparecer nas pendências.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        delivered: true,
        items: [{ productId: prod.id, quantity: 9, unitSalePrice: 25 }],
      })
      .expect(201);

    const res = await http
      .get("/api/events/insights")
      .query({ channel: "WHOLESALE" })
      .set(auth())
      .expect(200);

    const pd = res.body.pendingDeliveries;
    expect(pd.salesCount).toBe(1);
    expect(pd.totalQuantity).toBe(5);
    expect(pd.customers).toHaveLength(1);
    expect(pd.customers[0]).toMatchObject({
      id: customer.id,
      name: "Mercado Central",
      salesCount: 1,
    });
    expect(pd.customers[0].items).toEqual([
      expect.objectContaining({
        id: prod.id,
        name: "Rosa Colombiana",
        kind: "product",
        quantity: 5,
        unit: "MACO",
      }),
    ]);
  });

  it("pendingDeliveries agrupa venda sem cliente e sem itens (valor livre)", async () => {
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 80, title: "Avulsa pendente", channel: "RETAIL" })
      .expect(201);

    const res = await http
      .get("/api/events/insights")
      .query({ channel: "RETAIL" })
      .set(auth())
      .expect(200);

    const pd = res.body.pendingDeliveries;
    expect(pd.salesCount).toBe(1);
    expect(pd.totalQuantity).toBe(0);
    expect(pd.customers[0]).toMatchObject({ id: null, salesCount: 1, items: [] });
  });

  it("insights respeitam paymentStatus e search", async () => {
    const cat = await (
      await http.post("/api/categories").set(auth()).send({ name: "Lírios F" }).expect(201)
    ).body;
    const mkProd = async (name: string) =>
      (
        await http
          .post("/api/products")
          .set(auth())
          .send({ categoryId: cat.id, name, unit: "MACO", defaultSalePrice: 20 })
          .expect(201)
      ).body.id;
    const pagoId = await mkProd("Lírio Pago");
    const prazoId = await mkProd("Lírio Prazo");
    const ana = await (
      await http.post("/api/customers").set(auth()).send({ name: "Ana Flores" }).expect(201)
    ).body;
    const beto = await (
      await http.post("/api/customers").set(auth()).send({ name: "Beto Buquês" }).expect(201)
    ).body;

    const paga = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "RETAIL",
        customerId: ana.id,
        items: [{ productId: pagoId, quantity: 2, unitSalePrice: 20 }],
      })
      .expect(201);
    await http
      .post(`/api/finance/events/${paga.body.id}/payments`)
      .set(auth())
      .send({ amount: 40, method: "PIX" })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "RETAIL",
        customerId: beto.id,
        items: [{ productId: prazoId, quantity: 3, unitSalePrice: 20 }],
      })
      .expect(201);

    // paymentStatus=paid: só o item da venda quitada aparece no ranking.
    const paid = await http
      .get("/api/events/insights")
      .query({ channel: "RETAIL", paymentStatus: "paid" })
      .set(auth())
      .expect(200);
    const paidIds = paid.body.topItems.map((i: { id: string }) => i.id);
    expect(paidIds).toContain(pagoId);
    expect(paidIds).not.toContain(prazoId);
    const paidCustomers = paid.body.topCustomers.map((c: { id: string }) => c.id);
    expect(paidCustomers).toContain(ana.id);
    expect(paidCustomers).not.toContain(beto.id);

    // search por nome do cliente restringe rankings e pendências.
    const searched = await http
      .get("/api/events/insights")
      .query({ channel: "RETAIL", search: "Beto" })
      .set(auth())
      .expect(200);
    const sIds = searched.body.topItems.map((i: { id: string }) => i.id);
    expect(sIds).toContain(prazoId);
    expect(sIds).not.toContain(pagoId);
    expect(
      searched.body.pendingDeliveries.customers.map((c: { id: string | null }) => c.id),
    ).toEqual([beto.id]);
  });
});
