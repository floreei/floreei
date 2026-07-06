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
    token = (await registerCompany(http, { email: "dono@dre.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
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
      .send({ description: "Aluguel", costCenter: "Aluguel", amount: 1500, dueDate: day })
      .expect(201);
    expect(res.body.amount).toBe(1500);

    const list = await http.get("/api/expenses").set(auth()).expect(200);
    expect(list.body.total).toBe(1);
  });

  it("monta a DRE por COGS: receita - custo do vendido - despesas = resultado", async () => {
    // Venda de 1000 com lucro informado de 700 → COGS (custo do vendido) = 300.
    await http
      .post("/api/events")
      .set(auth())
      .send({
        customerId,
        title: "Casamento",
        date: day,
        soldValue: 1000,
        estimatedProfit: 700,
      })
      .expect(201);

    // Compra de 300 no período = saída de caixa (NÃO é o custo do vendido).
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
      .send({ description: "Aluguel", costCenter: "Aluguel", amount: 200, dueDate: day })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Frete", costCenter: "Transporte", amount: 100, dueDate: day })
      .expect(201);

    const dre = await http
      .get("/api/finance/dre?from=2026-06-01&to=2026-06-30")
      .set(auth())
      .expect(200);

    expect(dre.body.revenue).toBe(1000);
    expect(dre.body.cmv).toBe(300); // COGS = venda − lucro (não a compra)
    expect(dre.body.grossProfit).toBe(700);
    expect(dre.body.purchasesTotal).toBe(300); // compra = caixa, informativo
    expect(dre.body.losses).toBe(0);
    expect(dre.body.expensesTotal).toBe(300);
    expect(dre.body.netResult).toBe(400); // 700 − 300 − 0
    expect(dre.body.netMargin).toBe(40);
    expect(dre.body.expenses).toHaveLength(2);
  });

  it("despesa não paga fica em 'a pagar' e fora do caixa; ao pagar entra no caixa", async () => {
    const created = await http
      .post("/api/expenses")
      .set(auth())
      .send({
        description: "Conta de luz",
        costCenter: "Manutenção",
        amount: 500,
        dueDate: day,
        recurring: true,
      })
      .expect(201);
    const id = created.body.id;
    expect(created.body.paid).toBe(false);
    expect(created.body.recurring).toBe(true);

    // Anexa a conta (boleto) — arquivo do Storage (url).
    await http
      .post(`/api/expenses/${id}/attachments`)
      .set(auth())
      .send({
        label: "boleto.pdf",
        url: "https://storage.example.com/boleto.pdf",
        kind: "BILL",
        contentType: "application/pdf",
      })
      .expect(201);

    // Contas a pagar inclui a despesa; caixa do dia ainda não.
    const before = await http.get("/api/finance/summary").set(auth()).expect(200);
    expect(before.body.totalPayable).toBe(500);
    expect(
      before.body.payables.some(
        (p: { kind: string; id: string }) => p.kind === "EXPENSE" && p.id === id,
      ),
    ).toBe(true);

    const caixaAntes = await http
      .get(`/api/finance/cashflow?from=${day}&to=${day}`)
      .set(auth())
      .expect(200);
    expect(caixaAntes.body.saidas).toBe(0);

    // Marca como paga com comprovante.
    await http
      .post(`/api/expenses/${id}/pay`)
      .set(auth())
      .send({
        paidDate: day,
        paymentMethod: "PIX",
        receipt: {
          label: "comprovante.jpg",
          url: "https://storage.example.com/comprovante.jpg",
          contentType: "image/jpeg",
        },
      })
      .expect(201);

    // Agora sai do 'a pagar' e entra no caixa do dia.
    const after = await http.get("/api/finance/summary").set(auth()).expect(200);
    expect(after.body.totalPayable).toBe(0);

    const caixaDepois = await http
      .get(`/api/finance/cashflow?from=${day}&to=${day}`)
      .set(auth())
      .expect(200);
    expect(caixaDepois.body.saidas).toBe(500);

    // Dois anexos: a conta (BILL) e o comprovante (RECEIPT).
    const atts = await http
      .get(`/api/expenses/${id}/attachments`)
      .set(auth())
      .expect(200);
    expect(atts.body).toHaveLength(2);
    const kinds = atts.body.map((a: { kind: string }) => a.kind).sort();
    expect(kinds).toEqual(["BILL", "RECEIPT"]);
  });
});
