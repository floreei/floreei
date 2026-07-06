import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Loja online / storefront (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);
  // Slug único por execução: `companies` persiste entre runs (só os dados de
  // negócio são truncados), então um slug fixo colidiria com o run anterior.
  const slug = `loja-teste-${Date.now().toString(36)}`;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (
      await registerCompany(http, {
        email: "loja",
        companyName: "Flores Teste",
      })
    ).accessToken;
  });
  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  const publishArrangement = async (): Promise<string> => {
    const categoryId = (
      await http
        .post("/api/categories")
        .set(auth())
        .send({ name: "Buquês" })
        .expect(201)
    ).body.id;
    const productId = (
      await http
        .post("/api/products")
        .set(auth())
        .send({ name: "Rosa", categoryId, unit: "UNIDADE", currentUnitCost: 2 })
        .expect(201)
    ).body.id;
    const arr = (
      await http
        .post("/api/arrangements")
        .set(auth())
        .send({
          name: "Buquê Encanto",
          categoryId,
          pricingMode: "FIXED",
          salePrice: 100,
          storePublished: true,
          items: [{ productId, quantity: 3 }],
        })
        .expect(201)
    ).body;
    return arr.id as string;
  };

  const enableStore = () =>
    http
      .patch("/api/company/store")
      .set(auth())
      .send({
        slug,
        enabled: true,
        primaryColor: "#2F6050",
        accentColor: "#C6795B",
        headline: "Flores frescas",
      })
      .expect(200);

  it("expõe o branding público da loja ativa pelo slug", async () => {
    await enableStore();
    const res = await http.get(`/api/store/${slug}`).expect(200);
    expect(res.body.name).toBe("Flores Teste");
    expect(res.body.slug).toBe(slug);
    expect(res.body.primaryColor).toBe("#2F6050");
    expect(res.body.headline).toBe("Flores frescas");
    // O access token do Mercado Pago nunca é exposto.
    expect(res.body.mpAccessToken).toBeUndefined();
  });

  it("responde 404 para slug inexistente", async () => {
    await http.get("/api/store/nao-existe").expect(404);
  });

  it("lista no catálogo apenas os buquês publicados", async () => {
    await publishArrangement();
    await enableStore();
    const res = await http.get(`/api/store/${slug}/catalog`).expect(200);
    const items = (res.body.categories as { items: { name: string; price: number }[] }[]).flatMap(
      (c) => c.items,
    );
    expect(
      items.some((i) => i.name === "Buquê Encanto" && i.price === 100),
    ).toBe(true);
  });

  it("recusa o checkout quando a loja não configurou pagamento", async () => {
    const arrangementId = await publishArrangement();
    await enableStore();
    await http
      .post(`/api/store/${slug}/checkout`)
      .send({
        customer: { name: "Ana", phone: "11999998888" },
        items: [{ arrangementId, quantity: 1 }],
      })
      .expect(400);
  });

  it("lista os pedidos da loja no ERP (autenticado)", async () => {
    const res = await http.get("/api/store-orders").set(auth()).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
