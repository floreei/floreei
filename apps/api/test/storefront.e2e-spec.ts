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

  const publishArrangement = async (
    extra: Record<string, unknown> = {},
  ): Promise<string> => {
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
          ...extra,
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

  it("serve os campos de vitrine (descrição, selo, categoria, tamanhos) no catálogo", async () => {
    await publishArrangement({
      description: "Buquê lindo",
      badge: "Mais vendido",
      storeCategory: "buques",
      storeSizes: [
        { label: "Padrão", priceDelta: 0 },
        { label: "Grande", priceDelta: 60 },
      ],
    });
    await enableStore();
    const res = await http.get(`/api/store/${slug}/catalog`).expect(200);
    const item = (
      res.body.categories as { items: Record<string, unknown>[] }[]
    ).flatMap((c) => c.items)[0];
    expect(item.description).toBe("Buquê lindo");
    expect(item.badge).toBe("Mais vendido");
    expect(item.storeCategory).toBe("buques");
    expect(item.sizes).toEqual([
      { label: "Padrão", priceDelta: 0 },
      { label: "Grande", priceDelta: 60 },
    ]);
    expect(item.rating).toBe(0);
    expect(item.reviews).toBe(0);
  });

  const catalogItem = async (id: string) => {
    const res = await http.get(`/api/store/${slug}/catalog`).expect(200);
    return (res.body.categories as { items: { id: string }[] }[])
      .flatMap((c) => c.items)
      .find((i) => i.id === id) as Record<string, unknown>;
  };

  it("avaliação pública entra na média e a moderação a oculta", async () => {
    const id = await publishArrangement();
    await enableStore();

    const created = await http
      .post(`/api/store/${slug}/arrangements/${id}/reviews`)
      .send({ authorName: "Mariana", rating: 4, comment: "Chegou lindo!" })
      .expect(201);

    // Reflete no catálogo (média e contagem) e na listagem pública.
    let item = await catalogItem(id);
    expect(item.rating).toBe(4);
    expect(item.reviews).toBe(1);
    const publicList = await http
      .get(`/api/store/${slug}/arrangements/${id}/reviews`)
      .expect(200);
    expect(publicList.body).toHaveLength(1);
    expect(publicList.body[0].authorName).toBe("Mariana");

    // Moderação oculta a avaliação → some do público e da média.
    await http
      .patch(`/api/reviews/${created.body.id}`)
      .set(auth())
      .send({ status: "HIDDEN" })
      .expect(200);
    item = await catalogItem(id);
    expect(item.rating).toBe(0);
    expect(item.reviews).toBe(0);
    const afterHide = await http
      .get(`/api/store/${slug}/arrangements/${id}/reviews`)
      .expect(200);
    expect(afterHide.body).toHaveLength(0);
  });

  it("só as avaliações APROVADas contam na média", async () => {
    const id = await publishArrangement();
    await enableStore();
    for (const rating of [5, 3]) {
      await http
        .post(`/api/store/${slug}/arrangements/${id}/reviews`)
        .send({ authorName: "Cliente", rating })
        .expect(201);
    }
    const item = await catalogItem(id);
    expect(item.rating).toBe(4); // (5 + 3) / 2
    expect(item.reviews).toBe(2);
  });

  it("recusa avaliação para buquê não publicado na loja", async () => {
    await enableStore();
    await http
      .post(`/api/store/${slug}/arrangements/00000000-0000-0000-0000-000000000000/reviews`)
      .send({ authorName: "Cliente", rating: 5 })
      .expect(404);
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

  it("lista os pedidos da loja no ERP (paginado, autenticado)", async () => {
    const res = await http.get("/api/store-orders").set(auth()).expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toMatchObject({ page: 1, totalPages: expect.any(Number) });
  });

  it("filtra pedidos da loja por status", async () => {
    const res = await http
      .get("/api/store-orders")
      .query({ status: "PAID" })
      .set(auth())
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const order of res.body.data) {
      expect(order.status).toBe("PAID");
    }
  });
});
