import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Eventos + conversão (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;

  const items = [
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

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@eventos.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    const customer = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Ana e Pedro" })
      .expect(201);
    customerId = customer.body.id;
  });

  const createQuote = () =>
    http.post("/api/quotes").set(bearer(token)).send({ customerId, items });

  it("converte um orçamento em evento copiando os valores", async () => {
    const quote = await createQuote().expect(201);

    const event = await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(bearer(token))
      .send({ title: "Casamento Ana e Pedro", date: "2026-09-12", location: "Buffet Jardim" })
      .expect(201);

    expect(event.body.title).toBe("Casamento Ana e Pedro");
    expect(event.body.status).toBe("CONFIRMED");
    expect(event.body.soldValue).toBe(480);
    expect(event.body.estimatedProfit).toBe(255);
    expect(event.body.quoteId).toBe(quote.body.id);

    // o orçamento passa a APPROVED e fica vinculado ao evento
    const updatedQuote = await http
      .get(`/api/quotes/${quote.body.id}`)
      .set(bearer(token))
      .expect(200);
    expect(updatedQuote.body.status).toBe("APPROVED");
    expect(updatedQuote.body.eventId).toBe(event.body.id);
  });

  it("venda rápida usa preço por item (override) e cai para o padrão do catálogo", async () => {
    const cat = await http
      .post("/api/categories")
      .set(bearer(token))
      .send({ name: "Rosas" })
      .expect(201);
    const product = await http
      .post("/api/products")
      .set(bearer(token))
      .send({
        name: "Rosa",
        categoryId: cat.body.id,
        unit: "UNIDADE",
        defaultPurchasePrice: 4,
        defaultSalePrice: 10,
      })
      .expect(201);

    // Override: 3 × 15 = 45 de venda; custo 3 × 4 = 12; lucro 33.
    const withOverride = await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ items: [{ productId: product.body.id, quantity: 3, unitSalePrice: 15 }] })
      .expect(201);
    expect(withOverride.body.soldValue).toBe(45);
    expect(withOverride.body.estimatedProfit).toBe(33);

    // Os itens vendidos ficam persistidos (para o detalhe da venda).
    expect(withOverride.body.items).toHaveLength(1);
    expect(withOverride.body.items[0]).toMatchObject({
      description: "Rosa",
      quantity: 3,
      unitSalePrice: 15,
      lineTotal: 45,
    });
    const fetched = await http
      .get(`/api/events/${withOverride.body.id}`)
      .set(bearer(token))
      .expect(200);
    expect(fetched.body.items).toHaveLength(1);

    // Sem override: usa o preço padrão do catálogo (2 × 10 = 20).
    const withDefault = await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ items: [{ productId: product.body.id, quantity: 2 }] })
      .expect(201);
    expect(withDefault.body.soldValue).toBe(20);
  });

  it("não converte o mesmo orçamento duas vezes", async () => {
    const quote = await createQuote().expect(201);
    await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(bearer(token))
      .send({ title: "Festa", date: "2026-09-12" })
      .expect(201);
    await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(bearer(token))
      .send({ title: "Festa de novo", date: "2026-09-12" })
      .expect(400);
  });

  it("orçamento aprovado não pode mais ser editado", async () => {
    const quote = await createQuote().expect(201);
    await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(bearer(token))
      .send({ title: "Festa", date: "2026-09-12" })
      .expect(201);

    await http
      .patch(`/api/quotes/${quote.body.id}`)
      .set(bearer(token))
      .send({ customerId, items: [] })
      .expect(400);
  });

  it("cria evento manual e atualiza valor recebido/status", async () => {
    const event = await http
      .post("/api/events")
      .set(bearer(token))
      .send({
        customerId,
        title: "Aniversário",
        date: "2026-07-01",
        soldValue: 1000,
        estimatedProfit: 400,
      })
      .expect(201);

    const updated = await http
      .patch(`/api/events/${event.body.id}`)
      .set(bearer(token))
      .send({ receivedValue: 600, status: "IN_PROGRESS" })
      .expect(200);
    expect(updated.body.receivedValue).toBe(600);
    expect(updated.body.status).toBe("IN_PROGRESS");
  });

  it("permite venda sem cliente (Consumidor) e mostra no a receber", async () => {
    const sale = await http
      .post("/api/events")
      .set(bearer(token))
      .send({ title: "Buquê balcão", date: "2026-07-01", soldValue: 80 })
      .expect(201);
    expect(sale.body.customerId).toBeNull();
    expect(sale.body.type).toBe("ORDER");

    const summary = await http
      .get("/api/finance/summary")
      .set(bearer(token))
      .expect(200);
    const consumidor = summary.body.receivables.find(
      (r: { id: string }) => r.id === sale.body.id,
    );
    expect(consumidor.partyName).toBe("Consumidor");
    expect(consumidor.balanceDue).toBe(80);
  });

  it("venda manual é PEDIDO; conversão de orçamento é EVENTO; filtra por tipo", async () => {
    const pedido = await http
      .post("/api/events")
      .set(bearer(token))
      .send({ customerId, title: "Buquê de aniversário", date: "2026-07-01", soldValue: 120 })
      .expect(201);
    expect(pedido.body.type).toBe("ORDER");

    const quote = await http
      .post("/api/quotes")
      .set(bearer(token))
      .send({ customerId, items })
      .expect(201);
    const evento = await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(bearer(token))
      .send({ title: "Casamento", date: "2026-08-01" })
      .expect(201);
    expect(evento.body.type).toBe("EVENT");

    const orders = await http
      .get("/api/events?type=ORDER")
      .set(bearer(token))
      .expect(200);
    expect(orders.body.total).toBe(1);
    expect(orders.body.data[0].title).toBe("Buquê de aniversário");
  });

  it("venda rápida grava data da venda e data de entrega (pedido antigo)", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({
        customerId,
        amount: 150,
        title: "Pedido antigo",
        date: "2026-03-10",
        deliveryDate: "2026-03-12",
      })
      .expect(201);
    expect(sale.body.date).toBe("2026-03-10");
    expect(sale.body.deliveryDate).toBe("2026-03-12");

    // Backdata do recebimento: entra no fluxo de caixa da data da venda.
    await http
      .post(`/api/finance/events/${sale.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 150, method: "PIX", date: "2026-03-10" })
      .expect(201);
    const march = await http
      .get("/api/events?from=2026-03-01&to=2026-03-31&paymentStatus=paid")
      .set(bearer(token))
      .expect(200);
    expect(march.body.total).toBe(1);
    expect(march.body.data[0].title).toBe("Pedido antigo");
  });

  it("filtra por período e isola por empresa", async () => {
    await http
      .post("/api/events")
      .set(bearer(token))
      .send({ customerId, title: "Junho", date: "2026-06-15", soldValue: 100 })
      .expect(201);
    await http
      .post("/api/events")
      .set(bearer(token))
      .send({ customerId, title: "Agosto", date: "2026-08-15", soldValue: 200 })
      .expect(201);

    const june = await http
      .get("/api/events?from=2026-06-01&to=2026-06-30")
      .set(bearer(token))
      .expect(200);
    expect(june.body.total).toBe(1);
    expect(june.body.data[0].title).toBe("Junho");

    const other = await registerCompany(http, { email: "outro@eventos.com" });
    const otherList = await http
      .get("/api/events")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(otherList.body.total).toBe(0);
  });
});
