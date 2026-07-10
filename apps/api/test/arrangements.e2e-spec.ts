import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Buquês / ficha técnica (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let categoryId: string;

  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dona@buque.com" })).accessToken;
  });
  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    categoryId = (
      await http.post("/api/categories").set(auth()).send({ name: "Insumos" }).expect(201)
    ).body.id;
  });

  const insumo = async (
    name: string,
    unit: string,
    currentUnitCost: number,
  ): Promise<string> => {
    const res = await http
      .post("/api/products")
      .set(auth())
      .send({ name, categoryId, unit, currentUnitCost })
      .expect(201);
    return res.body.id;
  };

  it("rejeita quantidade fracionada em unidade contável; aceita em Metro/Grama", async () => {
    const rosa = await insumo("Rosa", "HASTE", 2); // contável
    const fita = await insumo("Fita", "METRO", 1.2); // fracionável

    await http
      .post("/api/arrangements")
      .set(auth())
      .send({ name: "Buquê Inválido", salePrice: 50, items: [{ productId: rosa, quantity: 2.5 }] })
      .expect(400);

    await http
      .post("/api/arrangements")
      .set(auth())
      .send({ name: "Buquê OK", salePrice: 50, items: [{ productId: fita, quantity: 0.5 }] })
      .expect(201);
  });

  it("calcula o custo, a margem e o % do buquê a partir da ficha técnica", async () => {
    const hortensia = await insumo("Hortênsia", "HASTE", 3);
    const rosa = await insumo("Rosa", "UNIDADE", 2.5);
    const fita = await insumo("Fita", "METRO", 1.2);

    const created = await http
      .post("/api/arrangements")
      .set(auth())
      .send({
        name: "Buquê Encanto",
        salePrice: 100,
        items: [
          { productId: hortensia, quantity: 1 },
          { productId: rosa, quantity: 3 },
          { productId: fita, quantity: 1 },
        ],
      })
      .expect(201);

    // 1×3 + 3×2,50 + 1×1,20 = 11,70
    expect(created.body.cost).toBe(11.7);
    expect(created.body.margin).toBe(88.3);
    expect(created.body.marginPercent).toBe(88.3);
    expect(created.body.items).toHaveLength(3);

    // O buquê reflete o custo ATUAL do insumo (última compra).
    const list = await http.get("/api/arrangements").set(auth()).expect(200);
    expect(list.body.data[0].cost).toBe(11.7);
  });

  it("produz N buquês ao cadastrar: baixa N× a ficha técnica do estoque", async () => {
    const hortensia = await insumo("Hortênsia", "HASTE", 3);
    const rosa = await insumo("Rosa", "UNIDADE", 2.5);
    const fita = await insumo("Fita", "METRO", 1.2);

    await http
      .post("/api/arrangements")
      .set(auth())
      .send({
        name: "Buquê Encanto",
        salePrice: 100,
        produce: 10,
        items: [
          { productId: hortensia, quantity: 1 },
          { productId: rosa, quantity: 3 },
          { productId: fita, quantity: 1 },
        ],
      })
      .expect(201);

    const overview = await http.get("/api/stock/overview").set(auth()).expect(200);
    const onHand = (id: string) =>
      overview.body.levels.find((l: { productId: string }) => l.productId === id)
        ?.onHand ?? 0;
    expect(onHand(hortensia)).toBe(-10); // 1 × 10
    expect(onHand(rosa)).toBe(-30); // 3 × 10
    expect(onHand(fita)).toBe(-10); // 1 × 10
  });

  it("precifica por markup % (sobre o custo) e o preço acompanha o custo", async () => {
    const especial = await insumo("Rosa Especial", "UNIDADE", 60);
    const created = await http
      .post("/api/arrangements")
      .set(auth())
      .send({
        name: "Buquê Markup",
        pricingMode: "MARGIN_PCT",
        profitPct: 40,
        items: [{ productId: especial, quantity: 1 }],
      })
      .expect(201);
    expect(created.body.cost).toBe(60);
    expect(created.body.salePrice).toBe(84); // 60 × (1 + 0,40)
    expect(created.body.margin).toBe(24); // 84 − 60

    // Insumo encarece (compra recebida a 70) → preço acompanha o markup.
    const supplier = (
      await http.post("/api/suppliers").set(auth()).send({ name: "Ceasa" }).expect(201)
    ).body.id;
    await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId: supplier,
        date: "2026-07-05",
        items: [
          { productId: especial, description: "Rosa", quantity: 1, unit: "UNIDADE", unitPrice: 70 },
        ],
      })
      .expect(201);

    const after = await http
      .get(`/api/arrangements/${created.body.id}`)
      .set(auth())
      .expect(200);
    expect(after.body.cost).toBe(70);
    expect(after.body.salePrice).toBe(98); // 70 × 1,40
  });

  it("precifica por lucro em R$", async () => {
    const especial = await insumo("Rosa", "UNIDADE", 60);
    const created = await http
      .post("/api/arrangements")
      .set(auth())
      .send({
        name: "Buquê Lucro",
        pricingMode: "PROFIT_VALUE",
        profitValue: 40,
        items: [{ productId: especial, quantity: 1 }],
      })
      .expect(201);
    expect(created.body.salePrice).toBe(100); // 60 + 40
    expect(created.body.margin).toBe(40);
  });

  it("edita a ficha técnica (troca insumos) e recalcula o custo", async () => {
    const rosa = await insumo("Rosa", "UNIDADE", 2.5);
    const created = await http
      .post("/api/arrangements")
      .set(auth())
      .send({
        name: "Buquê Simples",
        salePrice: 50,
        items: [{ productId: rosa, quantity: 4 }],
      })
      .expect(201);
    expect(created.body.cost).toBe(10); // 4 × 2,50

    const edited = await http
      .patch(`/api/arrangements/${created.body.id}`)
      .set(auth())
      .send({
        name: "Buquê Simples",
        salePrice: 50,
        items: [{ productId: rosa, quantity: 6 }],
      })
      .expect(200);
    expect(edited.body.cost).toBe(15); // 6 × 2,50
    expect(edited.body.margin).toBe(35);
  });

  it("recusa buquê sem insumos", async () => {
    await http
      .post("/api/arrangements")
      .set(auth())
      .send({ name: "Vazio", salePrice: 10, items: [] })
      .expect(400);
  });

  it("vender o buquê consome os insumos (fracionado) e persiste o COGS", async () => {
    const hortensia = await insumo("Hortênsia", "HASTE", 3);
    const rosa = await insumo("Rosa", "UNIDADE", 2.5);
    const fita = await insumo("Fita", "METRO", 1.2);

    // Semeia estoque (entrada manual, sem alterar o custo).
    const seed = (productId: string, quantity: number) =>
      http
        .post("/api/stock/movements")
        .set(auth())
        .send({ productId, type: "ENTRADA", quantity })
        .expect(201);
    await seed(hortensia, 10);
    await seed(rosa, 20);
    await seed(fita, 5);

    // Buquê com um componente FRACIONADO (0,5 metro de fita).
    const buque = await http
      .post("/api/arrangements")
      .set(auth())
      .send({
        name: "Buquê Encanto",
        salePrice: 100,
        items: [
          { productId: hortensia, quantity: 1 },
          { productId: rosa, quantity: 3 },
          { productId: fita, quantity: 0.5 },
        ],
      })
      .expect(201);
    expect(buque.body.cost).toBe(11.1); // 3 + 7,5 + 0,6

    // Vende 1 buquê pelo fluxo de balcão.
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ arrangementId: buque.body.id, quantity: 1 }] })
      .expect(201);
    expect(sale.body.soldValue).toBe(100);
    expect(sale.body.cost).toBe(11.1); // COGS persistido
    expect(sale.body.estimatedProfit).toBe(88.9);
    expect(sale.body.items[0].arrangementId).toBe(buque.body.id);

    // Estoque baixou (fracionado na fita).
    const overview = async () =>
      (await http.get("/api/stock/overview").set(auth()).expect(200)).body.levels;
    const onHand = (levels: { productId: string; onHand: number }[], id: string) =>
      levels.find((l) => l.productId === id)?.onHand;
    let levels = await overview();
    expect(onHand(levels, hortensia)).toBe(9);
    expect(onHand(levels, rosa)).toBe(17);
    expect(onHand(levels, fita)).toBe(4.5);

    // Vende mais 2 buquês → COGS 22,20 e estoque acompanha.
    const sale2 = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ arrangementId: buque.body.id, quantity: 2 }] })
      .expect(201);
    expect(sale2.body.cost).toBe(22.2);
    levels = await overview();
    expect(onHand(levels, hortensia)).toBe(7);
    expect(onHand(levels, rosa)).toBe(11);
    expect(onHand(levels, fita)).toBe(3.5);
  });

  it("estoque valorizado e perda valorizada a custo entram no resultado", async () => {
    const rosa = await insumo("Rosa", "UNIDADE", 4);
    await http
      .post("/api/stock/movements")
      .set(auth())
      .send({ productId: rosa, type: "ENTRADA", quantity: 10 })
      .expect(201);

    // Estoque valorizado = 10 × 4 = 40.
    let ov = (await http.get("/api/stock/overview").set(auth()).expect(200)).body;
    let level = ov.levels.find((l: { productId: string }) => l.productId === rosa);
    expect(level.unitCost).toBe(4);
    expect(level.value).toBe(40);
    expect(ov.totalValue).toBe(40);

    // Perda de 2 unidades.
    await http
      .post("/api/stock/movements")
      .set(auth())
      .send({ productId: rosa, type: "PERDA", quantity: 2 })
      .expect(201);

    ov = (await http.get("/api/stock/overview").set(auth()).expect(200)).body;
    level = ov.levels.find((l: { productId: string }) => l.productId === rosa);
    expect(level.onHand).toBe(8);
    expect(level.value).toBe(32); // 8 × 4

    // A perda entra na DRE valorizada a custo (2 × 4 = 8), reduzindo o resultado.
    const dre = (await http.get("/api/finance/dre").set(auth()).expect(200)).body;
    expect(dre.losses).toBe(8);
    expect(dre.netResult).toBe(-8); // sem receita, só a perda
  });

  it("vende insumo avulso (revenda) usando o custo atual do estoque", async () => {
    const rosa = await insumo("Rosa avulsa", "UNIDADE", 4);
    // Preço de venda padrão precisa existir → atualiza o produto.
    await http
      .patch(`/api/products/${rosa}`)
      .set(auth())
      .send({
        name: "Rosa avulsa",
        categoryId,
        unit: "UNIDADE",
        currentUnitCost: 4,
        defaultSalePrice: 10,
      })
      .expect(200);

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ items: [{ productId: rosa, quantity: 5 }] })
      .expect(201);
    expect(sale.body.soldValue).toBe(50); // 5 × 10
    expect(sale.body.cost).toBe(20); // 5 × 4 (custo atual)
    expect(sale.body.estimatedProfit).toBe(30);
  });
});
