import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Estoque (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let productId: string;
  let supplierId: string;
  let customerId: string;

  const auth = () => bearer(token);
  const day = "2026-06-10";

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@stock.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    const category = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Rosas" })
      .expect(201);
    const product = await http
      .post("/api/products")
      .set(auth())
      .send({
        categoryId: category.body.id,
        name: "Rosa Vermelha",
        unit: "MACO",
        defaultPurchasePrice: 4,
        defaultSalePrice: 10,
        minStock: 20,
      })
      .expect(201);
    productId = product.body.id;
    const supplier = await http
      .post("/api/suppliers")
      .set(auth())
      .send({ name: "Ceasa" })
      .expect(201);
    supplierId = supplier.body.id;
    const customer = await http
      .post("/api/customers")
      .set(auth())
      .send({ name: "Cliente Stock" })
      .expect(201);
    customerId = customer.body.id;
  });

  const onHandOf = async (id: string) => {
    const res = await http.get("/api/stock/overview").set(auth()).expect(200);
    return res.body.levels.find((l: { productId: string }) => l.productId === id);
  };

  it("compra recebida gera entrada no estoque", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 50, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    const level = await onHandOf(productId);
    expect(level.onHand).toBe(50);
    expect(level.low).toBe(false); // 50 > minStock 20
  });

  it("ajusta o saldo manualmente (contagem física, para cima e para baixo)", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 50, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);
    expect((await onHandOf(productId)).onHand).toBe(50);

    // Contagem = 60 → sobe (AJUSTE +10)
    await http
      .post("/api/stock/adjust")
      .set(auth())
      .send({ productId, balance: 60 })
      .expect(201);
    expect((await onHandOf(productId)).onHand).toBe(60);

    // Contagem = 12 → cai (correção −48)
    await http
      .post("/api/stock/adjust")
      .set(auth())
      .send({ productId, balance: 12, notes: "Contagem física" })
      .expect(201);
    expect((await onHandOf(productId)).onHand).toBe(12);

    // Mesmo saldo → nada a fazer
    await http
      .post("/api/stock/adjust")
      .set(auth())
      .send({ productId, balance: 12 })
      .expect(201);
    expect((await onHandOf(productId)).onHand).toBe(12);
  });

  it("compra ORDERED não mexe no estoque; receber registra; desfazer estorna", async () => {
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        status: "ORDERED",
        items: [{ productId, description: "Rosa", quantity: 40, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    // Pedido ainda não entregue → sem entrada no estoque
    expect((await onHandOf(productId)).onHand).toBe(0);

    // Marca como recebido → entra no estoque
    await http
      .post(`/api/purchases/${purchase.body.id}/receive`)
      .set(auth())
      .expect(201);
    expect((await onHandOf(productId)).onHand).toBe(40);

    // Desfaz o recebimento (volta para ORDERED) → estorna
    await http
      .patch(`/api/purchases/${purchase.body.id}`)
      .set(auth())
      .send({
        supplierId,
        date: day,
        status: "ORDERED",
        items: [{ productId, description: "Rosa", quantity: 40, unit: "MACO", unitPrice: 4 }],
      })
      .expect(200);
    expect((await onHandOf(productId)).onHand).toBe(0);
  });

  it("registra perda e reduz o saldo; aponta estoque baixo", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 30, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    await http
      .post("/api/stock/movements")
      .set(auth())
      .send({ productId, type: "PERDA", quantity: 18, notes: "Quebra" })
      .expect(201);

    const level = await onHandOf(productId);
    expect(level.onHand).toBe(12); // 30 - 18
    expect(level.low).toBe(true); // 12 <= minStock 20

    const overview = await http.get("/api/stock/overview").set(auth()).expect(200);
    expect(overview.body.lowCount).toBeGreaterThanOrEqual(1);
  });

  it("converter orçamento em evento dá baixa no estoque", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 100, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    const quote = await http
      .post("/api/quotes")
      .set(auth())
      .send({
        customerId,
        items: [
          { productId, description: "Rosa", quantity: 40, unit: "MACO", purchasePrice: 4, salePrice: 10 },
        ],
      })
      .expect(201);

    await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(auth())
      .send({ title: "Casamento", date: day })
      .expect(201);

    const level = await onHandOf(productId);
    expect(level.onHand).toBe(60); // 100 entrada - 40 saída
  });

  it("cancelar evento estorna o estoque", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 100, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    const quote = await http
      .post("/api/quotes")
      .set(auth())
      .send({
        customerId,
        items: [
          { productId, description: "Rosa", quantity: 40, unit: "MACO", purchasePrice: 4, salePrice: 10 },
        ],
      })
      .expect(201);
    const event = await http
      .post(`/api/events/from-quote/${quote.body.id}`)
      .set(auth())
      .send({ title: "Casamento", date: day })
      .expect(201);

    expect((await onHandOf(productId)).onHand).toBe(60); // 100 - 40

    const canceled = await http
      .post(`/api/events/${event.body.id}/cancel`)
      .set(auth())
      .expect(200);
    expect(canceled.body.status).toBe("CANCELED");

    expect((await onHandOf(productId)).onHand).toBe(100); // estornado

    // cancelar de novo é bloqueado
    await http
      .post(`/api/events/${event.body.id}/cancel`)
      .set(auth())
      .expect(400);
  });

  it("venda rápida com produtos baixa estoque e calcula lucro", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 100, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ productId, quantity: 10 }] })
      .expect(201);

    expect(sale.body.type).toBe("ORDER");
    expect(sale.body.customerId).toBeNull();
    expect(sale.body.soldValue).toBe(100); // 10 * 10
    expect(sale.body.estimatedProfit).toBe(60); // 10 * (10-4)

    expect((await onHandOf(productId)).onHand).toBe(90); // 100 - 10
  });

  it("venda rápida por valor livre não mexe no estoque", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 45, title: "Buquê pronto" })
      .expect(201);
    expect(sale.body.soldValue).toBe(45);
    expect(sale.body.title).toBe("Buquê pronto");
  });

  it("isola estoque por empresa", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: day,
        items: [{ productId, description: "Rosa", quantity: 10, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    const other = await registerCompany(http, { email: "outro@stock.com" });
    const overview = await http
      .get("/api/stock/overview")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(overview.body.levels).toHaveLength(0);
  });
});
