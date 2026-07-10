import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Compras — módulo completo (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let supplierId: string;
  let productId: string;

  const auth = () => bearer(token);
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@compras.com" })).accessToken;
  });
  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    supplierId = (
      await http.post("/api/suppliers").set(auth()).send({ name: "Ceasa" }).expect(201)
    ).body.id;
    const cat = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Rosas" })
      .expect(201);
    productId = (
      await http
        .post("/api/products")
        .set(auth())
        .send({ name: "Rosa", categoryId: cat.body.id, unit: "MACO", defaultPurchasePrice: 4 })
        .expect(201)
    ).body.id;
  });

  const onHand = async () => {
    const res = await http.get("/api/stock/overview").set(auth()).expect(200);
    return res.body.levels.find((l: { productId: string }) => l.productId === productId)
      ?.onHand;
  };

  it("rejeita quantidade fracionada em unidade contável; aceita em Metro", async () => {
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        items: [{ productId, description: "Rosa", quantity: 2.5, unit: "MACO", unitPrice: 4 }],
      })
      .expect(400);

    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        items: [{ description: "Fita", quantity: 2.5, unit: "METRO", unitPrice: 3 }],
      })
      .expect(201);
  });

  it("guarda entrega (data/hora), edita e retorna os itens", async () => {
    const created = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        deliveryDate: "2026-08-01",
        deliveryTime: "14:30",
        status: "ORDERED",
        items: [{ productId, description: "Rosa", quantity: 10, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);
    expect(created.body.deliveryDate).toBe("2026-08-01");
    expect(created.body.deliveryTime).toBe("14:30");

    // Edição retorna os itens (GET) e permite alterar preço
    const fetched = await http
      .get(`/api/purchases/${created.body.id}`)
      .set(auth())
      .expect(200);
    expect(fetched.body.items).toHaveLength(1);
    expect(fetched.body.items[0].description).toBe("Rosa");

    const edited = await http
      .patch(`/api/purchases/${created.body.id}`)
      .set(auth())
      .send({
        supplierId,
        date: today,
        status: "ORDERED",
        items: [{ productId, description: "Rosa", quantity: 10, unit: "MACO", unitPrice: 6 }],
      })
      .expect(200);
    expect(edited.body.total).toBe(60); // 10 × 6
  });

  it("recebe (entra no estoque) e desfaz a entrega (estorna)", async () => {
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        status: "ORDERED",
        items: [{ productId, description: "Rosa", quantity: 30, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);
    expect(await onHand()).toBe(0); // pedido não mexe no estoque

    await http.post(`/api/purchases/${purchase.body.id}/receive`).set(auth()).expect(201);
    expect(await onHand()).toBe(30);

    await http.post(`/api/purchases/${purchase.body.id}/unreceive`).set(auth()).expect(201);
    expect(await onHand()).toBe(0);
  });

  it("editar a compra recebida NÃO decrementa o estoque de novo (idempotente)", async () => {
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        status: "RECEIVED",
        items: [{ productId, description: "Rosa", quantity: 20, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);
    expect(await onHand()).toBe(20);

    // Edita só a descrição, mesma quantidade → saldo continua 20
    const body = {
      supplierId,
      date: today,
      status: "RECEIVED" as const,
      items: [{ productId, description: "Rosa Vermelha", quantity: 20, unit: "MACO", unitPrice: 4 }],
    };
    await http.patch(`/api/purchases/${purchase.body.id}`).set(auth()).send(body).expect(200);
    expect(await onHand()).toBe(20);

    // Edita de novo (2ª vez) → ainda 20 (sem estorno duplicado)
    await http.patch(`/api/purchases/${purchase.body.id}`).set(auth()).send(body).expect(200);
    expect(await onHand()).toBe(20);

    // Muda a quantidade para 12 → saldo reflete 12
    await http
      .patch(`/api/purchases/${purchase.body.id}`)
      .set(auth())
      .send({ ...body, items: [{ productId, description: "Rosa", quantity: 12, unit: "MACO", unitPrice: 4 }] })
      .expect(200);
    expect(await onHand()).toBe(12);
  });

  it("edita um pagamento (valor) e reajusta o saldo a pagar", async () => {
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        items: [{ description: "Rosas", quantity: 1, unit: "MACO", unitPrice: 300 }],
      })
      .expect(201);
    const pay = await http
      .post(`/api/finance/purchases/${purchase.body.id}/payments`)
      .set(auth())
      .send({ amount: 100 })
      .expect(201);
    expect(pay.body.balanceDue).toBe(200);

    // Corrige o valor de 100 → 250 (saldo 50)
    const edited = await http
      .patch(`/api/finance/purchases/${purchase.body.id}/payments/${pay.body.payment.id}`)
      .set(auth())
      .send({ amount: 250, method: "PIX" })
      .expect(200);
    expect(edited.body.paid).toBe(250);
    expect(edited.body.balanceDue).toBe(50);

    // Não permite passar do total
    await http
      .patch(`/api/finance/purchases/${purchase.body.id}/payments/${pay.body.payment.id}`)
      .set(auth())
      .send({ amount: 400, method: "PIX" })
      .expect(400);
  });

  it("remove um pagamento (baixa incorreta) e volta ao a pagar", async () => {
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        items: [{ description: "Rosas", quantity: 1, unit: "MACO", unitPrice: 200 }],
      })
      .expect(201);
    const pay = await http
      .post(`/api/finance/purchases/${purchase.body.id}/payments`)
      .set(auth())
      .send({ amount: 200 })
      .expect(201);
    expect(pay.body.balanceDue).toBe(0);

    await http
      .delete(`/api/finance/purchases/${purchase.body.id}/payments/${pay.body.payment.id}`)
      .set(auth())
      .expect(204);

    const after = await http.get(`/api/purchases/${purchase.body.id}`).set(auth()).expect(200);
    expect(after.body.paidAmount).toBe(0);
    expect(after.body.balanceDue).toBe(200);
  });

  it("insumo em pacote: comprar 1 maço (5 hastes, R$15) → estoque 5 e custo R$3/haste", async () => {
    const cat = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Hortênsias" })
      .expect(201);
    const insumo = await http
      .post("/api/products")
      .set(auth())
      .send({
        name: "Hortênsia Azul",
        categoryId: cat.body.id,
        unit: "HASTE",
        purchaseUnit: "MACO",
        packSize: 5,
        defaultPurchasePrice: 15,
      })
      .expect(201);

    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        status: "RECEIVED",
        items: [
          {
            productId: insumo.body.id,
            description: "Hortênsia Azul",
            quantity: 1,
            unit: "MACO",
            unitPrice: 15,
          },
        ],
      })
      .expect(201);
    expect(purchase.body.total).toBe(15);

    // Estoque em unidade-base: 1 maço × 5 = 5 hastes.
    const overview = await http.get("/api/stock/overview").set(auth()).expect(200);
    const level = overview.body.levels.find(
      (l: { productId: string }) => l.productId === insumo.body.id,
    );
    expect(level.onHand).toBe(5);
    expect(level.unit).toBe("HASTE");

    // Custo por unidade-base = 15 ÷ 5 = 3.
    const fetched = await http
      .get(`/api/products/${insumo.body.id}`)
      .set(auth())
      .expect(200);
    expect(fetched.body.currentUnitCost).toBe(3);

    // Nova compra a preço diferente atualiza o custo (última compra).
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        status: "RECEIVED",
        items: [
          {
            productId: insumo.body.id,
            description: "Hortênsia Azul",
            quantity: 1,
            unit: "MACO",
            unitPrice: 20,
          },
        ],
      })
      .expect(201);
    const after = await http
      .get(`/api/products/${insumo.body.id}`)
      .set(auth())
      .expect(200);
    expect(after.body.currentUnitCost).toBe(4); // 20 ÷ 5
  });

  it("anexa comprovante, lista e remove", async () => {
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: today,
        items: [{ description: "Rosas", quantity: 1, unit: "MACO", unitPrice: 50 }],
      })
      .expect(201);

    const att = await http
      .post(`/api/purchases/${purchase.body.id}/attachments`)
      .set(auth())
      .send({ label: "Comprovante Pix", url: "https://exemplo.com/pix.pdf" })
      .expect(201);
    expect(att.body.label).toBe("Comprovante Pix");

    const list = await http
      .get(`/api/purchases/${purchase.body.id}/attachments`)
      .set(auth())
      .expect(200);
    expect(list.body).toHaveLength(1);

    await http.delete(`/api/purchases/attachments/${att.body.id}`).set(auth()).expect(204);
    const after = await http
      .get(`/api/purchases/${purchase.body.id}/attachments`)
      .set(auth())
      .expect(200);
    expect(after.body).toHaveLength(0);
  });
});
