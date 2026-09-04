import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = iso(new Date());
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

describe("Atacado — resultado do período (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let otherToken: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "periodresult" })).accessToken;
    otherToken = (await registerCompany(http, { email: "periodresult-other" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  async function makeProduct(
    name: string,
    opts: { purchasePrice?: number; salePrice?: number; unitCost?: number } = {},
  ) {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: `Cat ${name}` }).expect(201)
    ).body;
    return (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          categoryId: cat.id,
          name,
          unit: "MACO",
          defaultPurchasePrice: opts.purchasePrice ?? 15,
          defaultSalePrice: opts.salePrice ?? 25,
          currentUnitCost: opts.unitCost ?? 15,
        })
        .expect(201)
    ).body.id;
  }

  it("agrega vendas do atacado com lucro por pedido e por item, despesas por vencimento e líquido", async () => {
    const pid = await makeProduct("Rosa");
    const gipsoId = await makeProduct("Gipso", { purchasePrice: 5, salePrice: 25, unitCost: 5 });
    const customer = (
      await http.post("/api/customers").set(auth()).send({ name: "Floricultura Bela" }).expect(201)
    ).body;

    // 2 pedidos no atacado dentro do período: (2 × 25, custo 2 × 15) e (1 × 30, custo 16)
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        customerId: customer.id,
        date: daysAgo(1),
        items: [{ productId: pid, quantity: 2, unitSalePrice: 25 }],
      })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        date: today,
        items: [{ productId: pid, quantity: 1, unitSalePrice: 30, unitCost: 16 }],
      })
      .expect(201);
    // Pedido em sociedade: Gipso, profitShares 3, 6 maços a 25 (default).
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        date: today,
        items: [{ productId: gipsoId, quantity: 6, profitShares: 3 }],
      })
      .expect(201);
    // Varejo e cancelada não entram.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "RETAIL", date: today, amount: 999, title: "Varejo" })
      .expect(201);
    const canceled = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, amount: 500, title: "Cancelada" })
      .expect(201);
    await http.post(`/api/events/${canceled.body.id}/cancel`).set(auth()).expect(200);

    // Despesas: uma paga e uma em aberto no período; uma fora do período.
    const paidExp = await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Ajudante João", costCenter: "Salários", amount: 20, dueDate: daysAgo(2) })
      .expect(201);
    await http
      .post(`/api/expenses/${paidExp.body.id}/pay`)
      .set(auth())
      .send({ paymentMethod: "PIX" })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "DAS Simples", costCenter: "Impostos e taxas", amount: 5, dueDate: daysAgo(1) })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Fora", costCenter: "Aluguel", amount: 1000, dueDate: daysAgo(30) })
      .expect(201);

    const res = await http
      .get("/api/events/period-result")
      .query({ channel: "WHOLESALE", from: daysAgo(7), to: today })
      .set(auth())
      .expect(200);

    expect(res.body.defaultedPeriod).toBe(false);
    expect(res.body.sales).toEqual({
      count: 3,
      revenue: 230,
      cost: 76,
      grossProfit: 154,
      grossMargin: 66.96,
      partnersShare: 80,
      myProfit: 74,
    });

    expect(res.body.orders).toHaveLength(3);
    const withCustomer = res.body.orders.find(
      (o: { customerName: string | null }) => o.customerName === "Floricultura Bela",
    );
    expect(withCustomer).toMatchObject({
      soldValue: 50,
      cost: 30,
      profit: 20,
      partnersShare: 0,
      myProfit: 20,
    });
    expect(withCustomer.items[0]).toMatchObject({
      quantity: 2,
      unitSalePrice: 25,
      unitCost: 15,
      lineTotal: 50,
      lineCost: 30,
      lineProfit: 20,
    });

    const soloOrder = res.body.orders.find(
      (o: { soldValue: number }) => o.soldValue === 30,
    );
    expect(soloOrder).toMatchObject({ profit: 14, partnersShare: 0, myProfit: 14 });

    const gipsoOrder = res.body.orders.find(
      (o: { soldValue: number }) => o.soldValue === 150,
    );
    expect(gipsoOrder).toMatchObject({ profit: 120, partnersShare: 80, myProfit: 40 });
    expect(gipsoOrder.items[0]).toMatchObject({
      profitShares: 3,
      myLineProfit: 40,
      partnersLineShare: 80,
    });

    expect(res.body.expenses.total).toBe(25);
    expect(res.body.expenses.paidTotal).toBe(20);
    expect(res.body.expenses.unpaidTotal).toBe(5);
    expect(res.body.expenses.groups.map((g: { costCenter: string }) => g.costCenter)).toEqual([
      "Salários",
      "Impostos e taxas",
    ]);
    const unpaid = res.body.expenses.groups[1].entries[0];
    expect(unpaid).toMatchObject({ description: "DAS Simples", paid: false, overdue: true });

    expect(res.body.net).toEqual({ value: 49, margin: 21.3 });
  });

  it("sem período, usa o mês corrente e sinaliza defaultedPeriod", async () => {
    const res = await http
      .get("/api/events/period-result")
      .query({ channel: "WHOLESALE" })
      .set(auth())
      .expect(200);
    expect(res.body.defaultedPeriod).toBe(true);
    expect(res.body.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(res.body.sales.count).toBe(0);
    expect(res.body.sales.grossMargin).toBeNull();
    expect(res.body.net.margin).toBeNull();
  });

  it("não vaza dados de outra empresa", async () => {
    const pid = await makeProduct("Lírio");
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 1 }] })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Só minha", costCenter: "Outros", amount: 10, dueDate: today })
      .expect(201);

    const res = await http
      .get("/api/events/period-result")
      .query({ channel: "WHOLESALE", from: today, to: today })
      .set(bearer(otherToken))
      .expect(200);
    expect(res.body.sales.count).toBe(0);
    expect(res.body.expenses.total).toBe(0);
  });
});
