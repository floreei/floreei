import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Editar itens da venda (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let productId: string;

  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@itens.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    const cat = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Rosas" })
      .expect(201);
    productId = (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          name: "Rosa",
          categoryId: cat.body.id,
          unit: "MACO",
          defaultPurchasePrice: 4,
          defaultSalePrice: 10,
        })
        .expect(201)
    ).body.id;
  });

  const onHand = async (id: string = productId): Promise<number> => {
    const res = await http.get("/api/stock/overview").set(auth()).expect(200);
    const level = res.body.levels.find(
      (l: { productId: string }) => l.productId === id,
    );
    return level?.onHand ?? 0;
  };

  /** Produto de pacote: 1 maço = 5 hastes; compra R$15/maço, venda R$30/maço. */
  const createPackProduct = async (): Promise<string> => {
    const cat = await http
      .post("/api/categories")
      .set(auth())
      .send({ name: "Hortênsias" })
      .expect(201);
    return (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          name: "Hortênsia Azul",
          categoryId: cat.body.id,
          unit: "HASTE",
          purchaseUnit: "MACO",
          packSize: 5,
          defaultPurchasePrice: 15,
          defaultSalePrice: 30,
          currentUnitCost: 3,
        })
        .expect(201)
    ).body.id;
  };

  it("adiciona itens a uma venda de valor livre (modo ITEMS: total = soma)", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 100 })
      .expect(201);
    expect(sale.body.soldValue).toBe(100);
    expect(sale.body.items).toHaveLength(0);

    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "ITEMS",
        items: [{ productId, quantity: 3, unitSalePrice: 15 }],
      })
      .expect(200);

    expect(edited.body.soldValue).toBe(45); // 3 × 15
    expect(edited.body.cost).toBe(12); // 3 × 4
    expect(edited.body.estimatedProfit).toBe(33);
    expect(edited.body.items).toHaveLength(1);
    expect(edited.body.items[0]).toMatchObject({
      description: "Rosa",
      quantity: 3,
      unitSalePrice: 15,
      lineTotal: 45,
    });
    expect(await onHand()).toBe(-3); // 3 saíram do estoque
  });

  it("modo FIXED mantém o valor da venda e grava os itens", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 100 })
      .expect(201);

    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "FIXED",
        soldValue: 100,
        items: [{ productId, quantity: 3, unitSalePrice: 15 }],
      })
      .expect(200);

    expect(edited.body.soldValue).toBe(100); // mantido
    expect(edited.body.cost).toBe(12);
    expect(edited.body.estimatedProfit).toBe(88); // 100 − 12
    expect(edited.body.items).toHaveLength(1);
  });

  it("reeditar troca os itens e ajusta o estoque (idempotente)", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ productId, quantity: 5 }] })
      .expect(201);
    expect(await onHand()).toBe(-5);

    // Reduz para 2 → estoque líquido volta para −2 (sem estorno duplicado).
    await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({ pricingMode: "ITEMS", items: [{ productId, quantity: 2 }] })
      .expect(200);
    expect(await onHand()).toBe(-2);
  });

  it("vende pelo MAÇO: custo e estoque pela base (5 hastes)", async () => {
    const pid = await createPackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        items: [{ productId: pid, quantity: 1, saleUnit: "MACO", unitSalePrice: 30 }],
      })
      .expect(201);

    expect(sale.body.soldValue).toBe(30);
    expect(sale.body.cost).toBe(15); // 5 hastes × R$3
    expect(sale.body.estimatedProfit).toBe(15);
    expect(sale.body.items[0]).toMatchObject({
      unit: "MACO",
      quantity: 1,
      unitSalePrice: 30,
      lineTotal: 30,
    });
    expect(await onHand(pid)).toBe(-5); // 1 maço = 5 hastes
  });

  it("vende pela HASTE: preço sugerido = maço ÷ conteúdo (R$6)", async () => {
    const pid = await createPackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ productId: pid, quantity: 3, saleUnit: "HASTE" }] })
      .expect(201);

    expect(sale.body.soldValue).toBe(18); // 3 × (30 ÷ 5)
    expect(sale.body.cost).toBe(9); // 3 × R$3
    expect(sale.body.items[0]).toMatchObject({
      unit: "HASTE",
      quantity: 3,
      unitSalePrice: 6,
    });
    expect(await onHand(pid)).toBe(-3);
  });

  it("sem saleUnit trata como unidade-base (não multiplica pelo pacote)", async () => {
    const pid = await createPackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ productId: pid, quantity: 2 }] })
      .expect(201);

    expect(sale.body.cost).toBe(6); // 2 × R$3 (base)
    expect(await onHand(pid)).toBe(-2);
  });

  it("não edita uma venda cancelada (400)", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ productId, quantity: 1 }] })
      .expect(201);
    await http
      .post(`/api/events/${sale.body.id}/cancel`)
      .set(auth())
      .expect(200);

    await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({ pricingMode: "ITEMS", items: [{ productId, quantity: 1 }] })
      .expect(400);
  });
});
