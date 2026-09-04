import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

const pad = (n: number) => String(n).padStart(2, "0");
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();

describe("Sociedade — lucro dividido entre N pessoas (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "profitshares" })).accessToken;
  });
  afterAll(async () => {
    await ctx.close();
  });
  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  async function makeGipso(profitShares = 3) {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Gipsófila" }).expect(201)
    ).body;
    const res = await http
      .post("/api/products")
      .set(auth())
      .send({
        categoryId: cat.id,
        name: "Gipso",
        unit: "MACO",
        defaultPurchasePrice: 5,
        defaultSalePrice: 25,
        currentUnitCost: 5,
        profitShares,
      })
      .expect(201);
    expect(res.body.profitShares).toBe(profitShares);
    return res.body.id as string;
  }

  it("produto guarda profitShares (padrão 1)", async () => {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Rosas" }).expect(201)
    ).body;
    const res = await http
      .post("/api/products")
      .set(auth())
      .send({ categoryId: cat.id, name: "Rosa", unit: "MACO", defaultSalePrice: 10 })
      .expect(201);
    expect(res.body.profitShares).toBe(1);
  });

  it("venda herda N do produto, divide só o lucro e permite ajustar na linha", async () => {
    const pid = await makeGipso(3);
    // 60 maços × 25 = 1500; custo 60 × 5 = 300; lucro 1200; sua parte 400.
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 60 }] })
      .expect(201);
    expect(sale.body).toMatchObject({
      soldValue: 1500,
      cost: 300,
      estimatedProfit: 1200,
      partnersShare: 800,
      myProfit: 400,
    });
    expect(sale.body.items[0]).toMatchObject({
      profitShares: 3,
      lineProfit: 1200,
      myLineProfit: 400,
      partnersLineShare: 800,
    });

    // Ajuste na linha: N = 2 → sua parte 600.
    const custom = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        date: today,
        items: [{ productId: pid, quantity: 60, profitShares: 2 }],
      })
      .expect(201);
    expect(custom.body.items[0].profitShares).toBe(2);
    expect(custom.body.myProfit).toBe(600);
    expect(custom.body.partnersShare).toBe(600);
  });

  it("arredonda a parte do usuário e joga a diferença para os sócios", async () => {
    const pid = await makeGipso(3);
    // 1 maço: lucro 20 → 6.67 pro usuário, 13.33 sócios.
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 1 }] })
      .expect(201);
    expect(sale.body.items[0].myLineProfit).toBe(6.67);
    expect(sale.body.items[0].partnersLineShare).toBe(13.33);
    expect(sale.body.myProfit).toBe(6.67);
  });

  it("editar itens preserva profitShares reenviado", async () => {
    const pid = await makeGipso(3);
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 1, profitShares: 2 }] })
      .expect(201);
    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "ITEMS",
        items: [{ productId: pid, quantity: 2, unitCost: 5, profitShares: 2 }],
      })
      .expect(200);
    expect(edited.body.items[0].profitShares).toBe(2);
    expect(edited.body.estimatedProfit).toBe(40);
    expect(edited.body.myProfit).toBe(20);
  });

  it("editar com pricingMode FIXED escala a parte dos sócios pro valor combinado", async () => {
    const pid = await makeGipso(3);
    // 60 maços × 25 = 1500; custo 300; lucro dos itens 1200 (minha parte 400, sócios 800).
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 60 }] })
      .expect(201);
    // Valor combinado (FIXED) 1000 ≠ soma dos itens: lucro real 700, rateado
    // pela linha (peso = custo) e dividido por N = 3 → sócios 466.67.
    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "FIXED",
        soldValue: 1000,
        items: [{ productId: pid, quantity: 60 }],
      })
      .expect(200);
    expect(edited.body.estimatedProfit).toBe(700);
    expect(edited.body.partnersShare).toBe(466.67);
    expect(edited.body.myProfit).toBe(233.33);
  });

  it("editar itens FIXED com itens a preço de custo ainda divide o lucro do cabeçalho", async () => {
    const pid = await makeGipso(3);
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 60 }] })
      .expect(201);
    // Itens lançados a preço de custo (lucro somado das linhas = 0), mas a
    // venda combinada é 1500: lucro 1200 → sócios 800, minha parte 400.
    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "FIXED",
        soldValue: 1500,
        items: [{ productId: pid, quantity: 60, unitSalePrice: 5, unitCost: 5 }],
      })
      .expect(200);
    expect(edited.body).toMatchObject({
      estimatedProfit: 1200,
      partnersShare: 800,
      myProfit: 400,
    });
  });

  it("PATCH da venda recalcula a parte dos sócios quando o lucro do cabeçalho muda", async () => {
    const pid = await makeGipso(3);
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 60 }] })
      .expect(201);
    expect(sale.body.partnersShare).toBe(800);
    const edited = await http
      .patch(`/api/events/${sale.body.id}`)
      .set(auth())
      .send({ soldValue: 900, estimatedProfit: 600 })
      .expect(200);
    expect(edited.body).toMatchObject({
      soldValue: 900,
      estimatedProfit: 600,
      partnersShare: 400,
      myProfit: 200,
    });
  });

  it("PATCH sem mudar o lucro preserva a divisão exata linha a linha", async () => {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Mistas" }).expect(201)
    ).body;
    const make = async (name: string, profitShares: number) =>
      (
        await http
          .post("/api/products")
          .set(auth())
          .send({
            categoryId: cat.id,
            name,
            unit: "MACO",
            defaultPurchasePrice: 100,
            defaultSalePrice: 200,
            currentUnitCost: 100,
            profitShares,
          })
          .expect(201)
      ).body.id as string;
    const a = await make("Sócia", 2);
    const b = await make("Só minha", 1);
    // A: lucro 100, N=2 → sócios 50. B: lucro 300, N=1 → sócios 0.
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        date: today,
        items: [
          { productId: a, quantity: 1, unitSalePrice: 200, unitCost: 100 },
          { productId: b, quantity: 1, unitSalePrice: 400, unitCost: 100 },
        ],
      })
      .expect(201);
    expect(sale.body).toMatchObject({
      soldValue: 600,
      estimatedProfit: 400,
      partnersShare: 50,
    });

    // O diálogo de edição reenvia soldValue/estimatedProfit inalterados ao
    // mexer só no título: a divisão exata das linhas tem de ser preservada.
    const renamed = await http
      .patch(`/api/events/${sale.body.id}`)
      .set(auth())
      .send({ title: "Renomeada", soldValue: 600, estimatedProfit: 400 })
      .expect(200);
    expect(renamed.body).toMatchObject({ title: "Renomeada", partnersShare: 50 });

    // Lucro realmente diferente: rateia pelas linhas (peso = custo).
    const rebated = await http
      .patch(`/api/events/${sale.body.id}`)
      .set(auth())
      .send({ soldValue: 600, estimatedProfit: 200 })
      .expect(200);
    expect(rebated.body).toMatchObject({ partnersShare: 50, myProfit: 150 });
  });

  it("compra em sociedade: total = nota ÷ N, nota cheia em grossTotal, custo do produto cheio", async () => {
    const pid = await makeGipso(3);
    const supplier = (
      await http.post("/api/suppliers").set(auth()).send({ name: "Sítio" }).expect(201)
    ).body;
    const purchase = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId: supplier.id,
        date: today,
        status: "RECEIVED",
        freight: 30,
        profitShares: 3,
        items: [{ productId: pid, description: "Gipso", quantity: 60, unit: "MACO", unitPrice: 4.5 }],
      })
      .expect(201);
    // itens 270 + frete 30 = 300 → paga 100.
    expect(purchase.body).toMatchObject({
      itemsTotal: 270,
      freight: 30,
      grossTotal: 300,
      total: 100,
      profitShares: 3,
      balanceDue: 100,
    });
    const product = await http.get(`/api/products/${pid}`).set(auth()).expect(200);
    // Custo por maço cheio (4.5), não ÷ 3.
    expect(product.body.currentUnitCost).toBe(4.5);

    // Compra sem sociedade continua igual.
    const plain = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId: supplier.id,
        date: today,
        items: [{ description: "Fita", quantity: 2, unit: "METRO", unitPrice: 3 }],
      })
      .expect(201);
    expect(plain.body).toMatchObject({ total: 6, grossTotal: 6, profitShares: 1 });
  });
});
