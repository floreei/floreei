import request from "supertest";
import { todayISO } from "../src/common/date/today";
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

  it("pendingDeliveries lista cada pedido não entregue, com datas e itens", async () => {
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

    // Pendente: 5 maços para o Mercado Central, entrega combinada para dia 20.
    const today = todayISO();
    const delivery = `${today.slice(0, 8)}20`;
    const pendente = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        customerId: customer.id,
        deliveryDate: delivery,
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
    expect(pd.totalValue).toBe(125);
    expect(pd.sales).toHaveLength(1);
    expect(pd.sales[0]).toMatchObject({
      id: pendente.body.id,
      customerId: customer.id,
      customerName: "Mercado Central",
      date: today,
      deliveryDate: delivery,
      totalValue: 125,
    });
    expect(pd.sales[0].items).toEqual([
      expect.objectContaining({
        id: prod.id,
        name: "Rosa Colombiana",
        kind: "product",
        quantity: 5,
        unit: "MACO",
        value: 125,
      }),
    ]);
  });

  it("pedidos do mesmo cliente vêm separados, na ordem da data de entrega (ou da venda)", async () => {
    const cat = await (
      await http.post("/api/categories").set(auth()).send({ name: "Gipsos" }).expect(201)
    ).body;
    const prod = await (
      await http
        .post("/api/products")
        .set(auth())
        .send({ categoryId: cat.id, name: "Gipso", unit: "MACO", defaultSalePrice: 10 })
        .expect(201)
    ).body;
    const customer = await (
      await http.post("/api/customers").set(auth()).send({ name: "Feira Grande" }).expect(201)
    ).body;
    const ym = todayISO().slice(0, 8);
    const mk = (quantity: number, extra: Record<string, unknown>) =>
      http
        .post("/api/events/quick")
        .set(auth())
        .send({
          channel: "WHOLESALE",
          customerId: customer.id,
          items: [{ productId: prod.id, quantity, unitSalePrice: 10 }],
          ...extra,
        })
        .expect(201);

    // Dia 25 (entrega), dia 05 (entrega) e um sem data de entrega vendido no dia 10.
    const d25 = await mk(50, { deliveryDate: `${ym}25` });
    const d05 = await mk(335, { deliveryDate: `${ym}05` });
    const semEntrega = await mk(100, { date: `${ym}10` });

    const res = await http
      .get("/api/events/insights")
      .query({ channel: "WHOLESALE" })
      .set(auth())
      .expect(200);

    const pd = res.body.pendingDeliveries;
    expect(pd.salesCount).toBe(3);
    expect(pd.totalQuantity).toBe(485);
    expect(pd.sales.map((s: { id: string }) => s.id)).toEqual([
      d05.body.id,
      semEntrega.body.id,
      d25.body.id,
    ]);
    expect(pd.sales[1]).toMatchObject({ date: `${ym}10`, deliveryDate: null });
    expect(pd.sales.map((s: { items: { quantity: number }[] }) => s.items[0].quantity)).toEqual([
      335, 100, 50,
    ]);
  });

  it("o período das entregas vale pelo dia de entrega, não pelo dia da venda", async () => {
    const cat = await (
      await http.post("/api/categories").set(auth()).send({ name: "Lírios V" }).expect(201)
    ).body;
    const prod = await (
      await http
        .post("/api/products")
        .set(auth())
        .send({ categoryId: cat.id, name: "Lírio", unit: "MACO", defaultSalePrice: 10 })
        .expect(201)
    ).body;
    const mk = (data: Record<string, unknown>) =>
      http
        .post("/api/events/quick")
        .set(auth())
        .send({
          channel: "WHOLESALE",
          items: [{ productId: prod.id, quantity: 1, unitSalePrice: 10 }],
          ...data,
        })
        .expect(201);

    // Vendida em outubro, entrega em novembro → só aparece em novembro.
    const proximoMes = await mk({ date: "2026-10-28", deliveryDate: "2026-11-05" });
    // Vendida em setembro, entrega em outubro → aparece em outubro.
    const mesPassado = await mk({ date: "2026-09-30", deliveryDate: "2026-10-02" });

    const outubro = await http
      .get("/api/events/insights")
      .query({ channel: "WHOLESALE", from: "2026-10-01", to: "2026-10-31" })
      .set(auth())
      .expect(200);
    expect(outubro.body.pendingDeliveries.sales.map((s: { id: string }) => s.id)).toEqual([
      mesPassado.body.id,
    ]);

    const novembro = await http
      .get("/api/events/insights")
      .query({ channel: "WHOLESALE", from: "2026-11-01", to: "2026-11-30" })
      .set(auth())
      .expect(200);
    expect(novembro.body.pendingDeliveries.sales.map((s: { id: string }) => s.id)).toEqual([
      proximoMes.body.id,
    ]);
  });

  it("delivered lista os pedidos já entregues, sem as pendências", async () => {
    const cat = await (
      await http.post("/api/categories").set(auth()).send({ name: "Rosas E" }).expect(201)
    ).body;
    const prod = await (
      await http
        .post("/api/products")
        .set(auth())
        .send({ categoryId: cat.id, name: "Rosa Vermelha", unit: "MACO", defaultSalePrice: 30 })
        .expect(201)
    ).body;
    const customer = await (
      await http.post("/api/customers").set(auth()).send({ name: "Feira do Centro" }).expect(201)
    ).body;

    // Entregues: duas vendas do mesmo cliente (9 e 3 maços).
    for (const quantity of [9, 3]) {
      await http
        .post("/api/events/quick")
        .set(auth())
        .send({
          channel: "WHOLESALE",
          customerId: customer.id,
          delivered: true,
          items: [{ productId: prod.id, quantity, unitSalePrice: 25 }],
        })
        .expect(201);
    }
    // Pendente: não pode aparecer nos entregues.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        customerId: customer.id,
        items: [{ productId: prod.id, quantity: 5, unitSalePrice: 25 }],
      })
      .expect(201);

    // O filtro `delivered` da tela não muda a seção (ela já fixa o status).
    for (const delivered of [undefined, false]) {
      const res = await http
        .get("/api/events/insights")
        .query({ channel: "WHOLESALE", delivered })
        .set(auth())
        .expect(200);

      const dl = res.body.delivered;
      expect(dl.salesCount).toBe(2);
      expect(dl.totalQuantity).toBe(12);
      expect(dl.totalValue).toBe(300);
      // Duas vendas do mesmo cliente são dois pedidos — não somam.
      expect(dl.sales).toHaveLength(2);
      for (const sale of dl.sales) {
        expect(sale).toMatchObject({
          customerId: customer.id,
          customerName: "Feira do Centro",
        });
      }
      expect(
        dl.sales.map((s: { totalValue: number }) => s.totalValue).sort((a: number, b: number) => a - b),
      ).toEqual([75, 225]);
      expect(
        dl.sales.flatMap((s: { items: { quantity: number }[] }) =>
          s.items.map((i) => i.quantity),
        ),
      ).toEqual(expect.arrayContaining([9, 3]));
      expect(dl.sales[0].items[0]).toMatchObject({
        id: prod.id,
        name: "Rosa Vermelha",
        kind: "product",
        unit: "MACO",
      });
      expect(res.body.pendingDeliveries.totalQuantity).toBe(5);
    }
  });

  it("pendingDeliveries lista venda sem cliente e sem itens (valor livre)", async () => {
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
    expect(pd.totalValue).toBe(80);
    expect(pd.sales[0]).toMatchObject({
      customerId: null,
      customerName: null,
      totalValue: 80,
      items: [],
    });
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
      searched.body.pendingDeliveries.sales.map((s: { customerId: string | null }) => s.customerId),
    ).toEqual([beto.id]);
  });
});
