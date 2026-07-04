import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Despesas e DRE (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;
  let supplierId: string;

  const auth = () => bearer(token);
  const day = "2026-06-15";

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
    token = (await registerCompany(http, { email: "dono@dre.com" })).accessToken;
    customerId = (
      await http.post("/api/customers").set(auth()).send({ name: "Ana" }).expect(201)
    ).body.id;
    supplierId = (
      await http.post("/api/suppliers").set(auth()).send({ name: "Ceasa" }).expect(201)
    ).body.id;
  });

  it("registra despesa e valida o período", async () => {
    const res = await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Aluguel", costCenter: "Aluguel", amount: 1500, date: day })
      .expect(201);
    expect(res.body.amount).toBe(1500);

    const list = await http.get("/api/expenses").set(auth()).expect(200);
    expect(list.body.total).toBe(1);
  });

  it("monta a DRE: receita - CMV - despesas = resultado", async () => {
    // Receita: evento de 1000
    await http
      .post("/api/events")
      .set(auth())
      .send({ customerId, title: "Casamento", date: day, soldValue: 1000 })
      .expect(201);

    // CMV: compra de 300
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ description: "Rosas", quantity: 30, unit: "MACO", unitPrice: 10 }],
      })
      .expect(201);

    // Despesas: 200 (aluguel) + 100 (transporte)
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Aluguel", costCenter: "Aluguel", amount: 200, date: day })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Frete", costCenter: "Transporte", amount: 100, date: day })
      .expect(201);

    const dre = await http
      .get("/api/finance/dre?from=2026-06-01&to=2026-06-30")
      .set(auth())
      .expect(200);

    expect(dre.body.revenue).toBe(1000);
    expect(dre.body.cmv).toBe(300);
    expect(dre.body.grossProfit).toBe(700);
    expect(dre.body.expensesTotal).toBe(300);
    expect(dre.body.netResult).toBe(400);
    expect(dre.body.netMargin).toBe(40);
    expect(dre.body.expenses).toHaveLength(2);
  });
});
