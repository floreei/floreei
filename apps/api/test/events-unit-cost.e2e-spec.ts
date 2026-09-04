import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Vendas — custo por item (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "unitcost" });
    token = reg.accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  /** Maço de 5 hastes: custo 3/haste (=15/maço), venda 25/maço. */
  async function makePackProduct() {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Rosas" }).expect(201)
    ).body;
    return (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          categoryId: cat.id,
          name: "Rosa Vermelha",
          unit: "HASTE",
          purchaseUnit: "MACO",
          packSize: 5,
          defaultPurchasePrice: 15,
          defaultSalePrice: 25,
          currentUnitCost: 3,
        })
        .expect(201)
    ).body.id;
  }

  it("grava unitCost informado e usa na soma do custo da venda", async () => {
    const pid = await makePackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 2, saleUnit: "MACO", unitSalePrice: 25, unitCost: 16 }],
      })
      .expect(201);

    expect(sale.body.soldValue).toBe(50);
    expect(sale.body.cost).toBe(32);
    expect(sale.body.estimatedProfit).toBe(18);
    expect(sale.body.items[0]).toMatchObject({
      unitCost: 16,
      lineCost: 32,
      lineProfit: 18,
    });
  });

  it("sem unitCost, usa o custo do produto na unidade da linha (maço = haste × packSize)", async () => {
    const pid = await makePackProduct();
    const byPack = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 2, saleUnit: "MACO", unitSalePrice: 25 }],
      })
      .expect(201);
    expect(byPack.body.items[0].unitCost).toBe(15);
    expect(byPack.body.cost).toBe(30);

    const byStem = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 4, saleUnit: "HASTE", unitSalePrice: 6 }],
      })
      .expect(201);
    expect(byStem.body.items[0].unitCost).toBe(3);
    expect(byStem.body.cost).toBe(12);
  });

  it("sem custo atual, cai no preço de compra padrão", async () => {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Folhagens" }).expect(201)
    ).body;
    const pid = (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          categoryId: cat.id,
          name: "Eucalipto",
          unit: "HASTE",
          purchaseUnit: "MACO",
          packSize: 10,
          defaultPurchasePrice: 20,
          defaultSalePrice: 40,
          currentUnitCost: 0,
        })
        .expect(201)
    ).body.id;

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 1, saleUnit: "MACO", unitSalePrice: 40 }],
      })
      .expect(201);
    expect(sale.body.items[0].unitCost).toBe(20);
    expect(sale.body.cost).toBe(20);
  });

  it("editar itens preserva o unitCost reenviado", async () => {
    const pid = await makePackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 1, saleUnit: "MACO", unitSalePrice: 25, unitCost: 17 }],
      })
      .expect(201);

    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "ITEMS",
        items: [{ productId: pid, quantity: 3, saleUnit: "MACO", unitSalePrice: 25, unitCost: 17 }],
      })
      .expect(200);
    expect(edited.body.items[0].unitCost).toBe(17);
    expect(edited.body.cost).toBe(51);
    expect(edited.body.estimatedProfit).toBe(24);
  });
});
