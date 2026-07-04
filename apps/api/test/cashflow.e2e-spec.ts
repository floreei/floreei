import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Caixa / fluxo de caixa (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;

  const auth = () => bearer(token);
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
    token = (await registerCompany(http, { email: "dono@caixa.com" })).accessToken;
    customerId = (
      await http.post("/api/customers").set(auth()).send({ name: "Ana" }).expect(201)
    ).body.id;
  });

  it("consolida recebimentos, despesas e entradas avulsas no dia", async () => {
    // Venda à vista de 200 (recebimento)
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ customerId, amount: 200 })
      .expect(201);
    await http
      .post(`/api/finance/events/${sale.body.id}/payments`)
      .set(auth())
      .send({ amount: 200, method: "PIX" })
      .expect(201);

    // Despesa de 50
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Transporte", costCenter: "Transporte", amount: 50, date: today })
      .expect(201);

    // Entrada avulsa de 30
    await http
      .post("/api/finance/cash-in")
      .set(auth())
      .send({ amount: 30, description: "Troco/venda avulsa" })
      .expect(201);

    const res = await http.get("/api/finance/cashflow").set(auth()).expect(200);

    expect(res.body.entradas).toBe(230); // 200 + 30
    expect(res.body.saidas).toBe(50); // despesa
    expect(res.body.saldo).toBe(180);
    expect(res.body.movements.length).toBe(3);
    const kinds = res.body.movements.map((m: { kind: string }) => m.kind).sort();
    expect(kinds).toEqual(["expense", "manual", "receivement"]);

    // O recebimento aponta para a venda de origem (clicável no caixa).
    const receivement = res.body.movements.find(
      (m: { kind: string }) => m.kind === "receivement",
    );
    expect(receivement.sourceType).toBe("event");
    expect(receivement.sourceId).toBe(sale.body.id);
    expect(receivement.description).toContain("Recebimento");
  });

  it("agrega entradas/saídas/saldo por mês no ano", async () => {
    const year = d.getFullYear();

    // Março: entrada 100, despesa 50 → saldo 50
    await http
      .post("/api/finance/cash-in")
      .set(auth())
      .send({ amount: 100, description: "Venda", date: `${year}-03-10` })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Frete", costCenter: "Transporte", amount: 50, date: `${year}-03-15` })
      .expect(201);

    // Junho: entrada 300, despesa 20 → saldo 280
    await http
      .post("/api/finance/cash-in")
      .set(auth())
      .send({ amount: 300, description: "Casamento", date: `${year}-06-01` })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Vaso", costCenter: "Insumos", amount: 20, date: `${year}-06-20` })
      .expect(201);

    const res = await http
      .get("/api/finance/cashflow/monthly")
      .query({ year })
      .set(auth())
      .expect(200);

    expect(res.body.year).toBe(year);
    expect(res.body.months).toHaveLength(12);

    const mar = res.body.months[2];
    expect(mar).toMatchObject({ month: 3, entradas: 100, saidas: 50, saldo: 50 });

    const jun = res.body.months[5];
    expect(jun).toMatchObject({ month: 6, entradas: 300, saidas: 20, saldo: 280 });

    // Meses sem movimento ficam zerados
    expect(res.body.months[0]).toMatchObject({ entradas: 0, saidas: 0, saldo: 0 });

    const totalEntradas = res.body.months.reduce(
      (s: number, m: { entradas: number }) => s + m.entradas,
      0,
    );
    expect(totalEntradas).toBe(400);
  });

  it("isola o caixa por empresa", async () => {
    await http
      .post("/api/finance/cash-in")
      .set(auth())
      .send({ amount: 100, description: "X" })
      .expect(201);

    const other = await registerCompany(http, { email: "outro@caixa.com" });
    const res = await http
      .get("/api/finance/cashflow")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(res.body.entradas).toBe(0);
    expect(res.body.movements).toHaveLength(0);
  });
});
