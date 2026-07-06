import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Orçamentos (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@orc.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    const customer = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "João e Maria" })
      .expect(201);
    customerId = customer.body.id;
  });

  const sampleItems = [
    {
      description: "Hortênsia Azul",
      quantity: 10,
      unit: "MACO",
      purchasePrice: 12.5,
      salePrice: 30,
    },
    {
      description: "Rosa Vermelha",
      quantity: 2,
      unit: "MACO",
      purchasePrice: 50,
      salePrice: 90,
    },
  ];

  it("cria orçamento calculando totais e atribuindo número", async () => {
    const res = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    expect(res.body.number).toBe(1);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.totalCost).toBe(225);
    expect(res.body.totalSale).toBe(480);
    expect(res.body.totalProfit).toBe(255);
    expect(res.body.marginPct).toBe(53.13);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].lineProfit).toBe(175);
  });

  it("numera orçamentos sequencialmente por empresa", async () => {
    const a = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: [] })
      .expect(201);
    const b = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: [] })
      .expect(201);
    expect(a.body.number).toBe(1);
    expect(b.body.number).toBe(2);
  });

  it("edita itens e recalcula totais", async () => {
    const created = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    const updated = await http
      .patch(`/api/quotes/${created.body.id}`)
      .set(bearer(token))
      .send({
        customerId,
        items: [
          {
            description: "Só hortênsia",
            quantity: 1,
            unit: "MACO",
            purchasePrice: 10,
            salePrice: 25,
          },
        ],
      })
      .expect(200);

    expect(updated.body.items).toHaveLength(1);
    expect(updated.body.totalSale).toBe(25);
    expect(updated.body.totalProfit).toBe(15);
  });

  it("faz transição de status DRAFT → SENT", async () => {
    const created = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    const sent = await http
      .patch(`/api/quotes/${created.body.id}/status`)
      .set(bearer(token))
      .send({ status: "SENT" })
      .expect(200);
    expect(sent.body.status).toBe("SENT");
  });

  it("não permite aprovar pelo endpoint de status (usa conversão)", async () => {
    const created = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    await http
      .patch(`/api/quotes/${created.body.id}/status`)
      .set(bearer(token))
      .send({ status: "APPROVED" })
      .expect(400);
  });

  it("filtra por status e isola por empresa", async () => {
    const q = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);
    await http
      .patch(`/api/quotes/${q.body.id}/status`)
      .set(bearer(token))
      .send({ status: "SENT" })
      .expect(200);

    const sent = await http
      .get("/api/quotes?status=SENT")
      .set(bearer(token))
      .expect(200);
    expect(sent.body.total).toBe(1);

    const other = await registerCompany(http, { email: "outro@orc.com" });
    const otherList = await http
      .get("/api/quotes")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(otherList.body.total).toBe(0);
  });

  it("cancela um orçamento (status CANCELED)", async () => {
    const quote = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    const canceled = await http
      .patch(`/api/quotes/${quote.body.id}/status`)
      .set(bearer(token))
      .send({ status: "CANCELED" })
      .expect(200);
    expect(canceled.body.status).toBe("CANCELED");
  });

  it("duplica um orçamento copiando itens com novo número", async () => {
    const original = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    const copy = await http
      .post(`/api/quotes/${original.body.id}/duplicate`)
      .set(bearer(token))
      .expect(201);

    expect(copy.body.id).not.toBe(original.body.id);
    expect(copy.body.number).toBe(original.body.number + 1);
    expect(copy.body.status).toBe("DRAFT");
    expect(copy.body.items).toHaveLength(2);
    expect(copy.body.totalSale).toBe(original.body.totalSale);
    expect(copy.body.customerId).toBe(customerId);
  });

  it("rejeita orçamento para cliente de outra empresa", async () => {
    const other = await registerCompany(http, { email: "x@orc.com" });
    await http
      .post("/api/quotes")
      .set(bearer(other.accessToken))
      .send({ customerId, items: [] })
      .expect(404);
  });

  it("exclui um orçamento não convertido (204) e some da listagem", async () => {
    const quote = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);

    await http
      .delete(`/api/quotes/${quote.body.id}`)
      .set(bearer(token))
      .expect(204);

    await http
      .get(`/api/quotes/${quote.body.id}`)
      .set(bearer(token))
      .expect(404);
  });

  it("não exclui orçamento já convertido em evento (400)", async () => {
    const quote = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items: sampleItems })
      .expect(201);
    await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(bearer(token))
      .send({ title: "Casamento", date: "2026-09-12" })
      .expect(201);

    await http
      .delete(`/api/quotes/${quote.body.id}`)
      .set(bearer(token))
      .expect(400);
  });
});
