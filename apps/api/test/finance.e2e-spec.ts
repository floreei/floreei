import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Fornecedores, Compras e Financeiro (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;

  const thisMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-10`;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
    token = (await registerCompany(http, { email: "dono@fin.com" })).accessToken;
    const customer = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Cliente Fin" })
      .expect(201);
    customerId = customer.body.id;
  });

  it("cria fornecedor", async () => {
    const res = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Ceasa Flores", city: "São Paulo", paymentTerms: "30 dias" })
      .expect(201);
    expect(res.body.name).toBe("Ceasa Flores");
  });

  it("registra compra calculando total com frete", async () => {
    const supplier = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Fornecedor X" })
      .expect(201);

    const purchase = await http
      .post("/api/purchases")
      .set(bearer(token))
      .send({
        supplierId: supplier.body.id,
        date: thisMonth(),
        freight: 20,
        items: [
          { description: "Rosas", quantity: 10, unit: "MACO", unitPrice: 4 },
          { description: "Hortênsias", quantity: 5, unit: "MACO", unitPrice: 12 },
        ],
      })
      .expect(201);

    expect(purchase.body.itemsTotal).toBe(100); // 40 + 60
    expect(purchase.body.total).toBe(120); // + frete 20
    expect(purchase.body.paidAmount).toBe(0);
    expect(purchase.body.balanceDue).toBe(120);
  });

  it("fecha o ciclo: compra a pagar e evento a receber no resumo financeiro", async () => {
    // Compra (a pagar 120)
    const supplier = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Fornecedor Y" })
      .expect(201);
    const purchase = await http
      .post("/api/purchases")
      .set(bearer(token))
      .send({
        supplierId: supplier.body.id,
        date: thisMonth(),
        freight: 20,
        items: [{ description: "Rosas", quantity: 10, unit: "MACO", unitPrice: 10 }],
      })
      .expect(201);

    // Pagamento parcial de 50 ao fornecedor
    const pay = await http
      .post(`/api/finance/purchases/${purchase.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 50, method: "PIX" })
      .expect(201);
    expect(pay.body.paid).toBe(50);
    expect(pay.body.balanceDue).toBe(70);

    // Evento (vendido 300), recebe 100
    const event = await http
      .post("/api/events")
      .set(bearer(token))
      .send({
        customerId,
        title: "Casamento",
        date: thisMonth(),
        soldValue: 300,
      })
      .expect(201);
    const receive = await http
      .post(`/api/finance/events/${event.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 100 })
      .expect(201);
    expect(receive.body.balanceDue).toBe(200);

    // Resumo financeiro
    const summary = await http
      .get("/api/finance/summary")
      .set(bearer(token))
      .expect(200);

    expect(summary.body.totalPayable).toBe(70); // 120 - 50
    expect(summary.body.totalReceivable).toBe(200); // 300 - 100
    expect(summary.body.paidThisMonth).toBe(50);
    expect(summary.body.receivedThisMonth).toBe(100);
    expect(summary.body.netThisMonth).toBe(50);
    expect(summary.body.payables).toHaveLength(1);
    expect(summary.body.receivables).toHaveLength(1);
    expect(summary.body.receivables[0].partyName).toBe("Cliente Fin");
  });

  it("compra a pagar aceita pagamento parcial e depois quitação", async () => {
    const supplier = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Fornecedor Parcial" })
      .expect(201);

    const purchase = await http
      .post("/api/purchases")
      .set(bearer(token))
      .send({
        supplierId: supplier.body.id,
        date: thisMonth(),
        items: [{ description: "Rosas", quantity: 1, unit: "MACO", unitPrice: 250 }],
      })
      .expect(201);
    expect(purchase.body.total).toBe(250);
    expect(purchase.body.balanceDue).toBe(250);

    // Pagamento parcial de 100 → saldo 150
    const partial = await http
      .post(`/api/finance/purchases/${purchase.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 100 })
      .expect(201);
    expect(partial.body.balanceDue).toBe(150);

    // Quita o restante
    await http
      .post(`/api/finance/purchases/${purchase.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 150 })
      .expect(201);

    const summary = await http
      .get("/api/finance/summary")
      .set(bearer(token))
      .expect(200);
    expect(summary.body.totalPayable).toBe(0);
  });

  it("recusa recebimento acima do saldo", async () => {
    const event = await http
      .post("/api/events")
      .set(bearer(token))
      .send({ customerId, title: "Festa", date: thisMonth(), soldValue: 100 })
      .expect(201);
    await http
      .post(`/api/finance/events/${event.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 150 })
      .expect(400);
  });

  it("desfaz um recebimento: volta ao a receber e some do caixa", async () => {
    const event = await http
      .post("/api/events")
      .set(bearer(token))
      .send({ customerId, title: "Aniversário", date: thisMonth(), soldValue: 200 })
      .expect(201);
    const receive = await http
      .post(`/api/finance/events/${event.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 80, method: "PIX", date: thisMonth() })
      .expect(201);

    let summary = await http.get("/api/finance/summary").set(bearer(token)).expect(200);
    expect(summary.body.totalReceivable).toBe(120);

    await http
      .delete(`/api/finance/events/${event.body.id}/payments/${receive.body.payment.id}`)
      .set(bearer(token))
      .expect(204);

    summary = await http.get("/api/finance/summary").set(bearer(token)).expect(200);
    expect(summary.body.totalReceivable).toBe(200); // recebimento desfeito
    expect(summary.body.receivedThisMonth).toBe(0);

    const cash = await http
      .get("/api/finance/cashflow")
      .query({ from: thisMonth(), to: thisMonth() })
      .set(bearer(token))
      .expect(200);
    expect(cash.body.entradas).toBe(0); // saiu do caixa
  });

  it("isola compras por empresa", async () => {
    const supplier = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Fornecedor Z" })
      .expect(201);
    await http
      .post("/api/purchases")
      .set(bearer(token))
      .send({
        supplierId: supplier.body.id,
        date: thisMonth(),
        items: [{ description: "X", quantity: 1, unit: "UNIDADE", unitPrice: 5 }],
      })
      .expect(201);

    const other = await registerCompany(http, { email: "outro@fin.com" });
    const list = await http
      .get("/api/purchases")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(list.body.total).toBe(0);
  });
});
