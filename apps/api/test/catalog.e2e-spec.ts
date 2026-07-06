import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Catálogo (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;

  const createCategory = (name: string) =>
    http.post("/api/categories").set(bearer(token)).send({ name });

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@catalogo.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("cria categoria e impede nome duplicado", async () => {
    await createCategory("Rosas").expect(201);
    await createCategory("Rosas").expect(409);
  });

  it("guarda a imagem (URL) do produto", async () => {
    const cat = await createCategory("Vinhos").expect(201);
    const url = "https://storage.googleapis.com/x/companies/y/products/z.jpg";
    const created = await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: cat.body.id, name: "Vinho Tinto", imageUrl: url })
      .expect(201);
    expect(created.body.imageUrl).toBe(url);

    const fetched = await http
      .get(`/api/products?categoryId=${cat.body.id}`)
      .set(bearer(token))
      .expect(200);
    expect(fetched.body.data[0].imageUrl).toBe(url);
  });

  it("cria produto vinculado a uma categoria e calcula nada extra", async () => {
    const cat = await createCategory("Hortênsias").expect(201);

    const product = await http
      .post("/api/products")
      .set(bearer(token))
      .send({
        categoryId: cat.body.id,
        name: "Hortênsia Azul",
        unit: "MACO",
        defaultPurchasePrice: 12.5,
        defaultSalePrice: 30,
      })
      .expect(201);

    expect(product.body.name).toBe("Hortênsia Azul");
    expect(product.body.defaultPurchasePrice).toBe(12.5);
    expect(product.body.defaultSalePrice).toBe(30);
    expect(product.body.unit).toBe("MACO");
  });

  it("rejeita produto com categoria inexistente", async () => {
    await http
      .post("/api/products")
      .set(bearer(token))
      .send({
        categoryId: "00000000-0000-0000-0000-000000000000",
        name: "Solto",
      })
      .expect(404);
  });

  it("lista categorias com contagem de produtos", async () => {
    const cat = await createCategory("Folhagens").expect(201);
    await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: cat.body.id, name: "Eucalipto" })
      .expect(201);

    const list = await http.get("/api/categories").set(bearer(token)).expect(200);
    expect(list.body[0].name).toBe("Folhagens");
    expect(list.body[0].productCount).toBe(1);
  });

  it("impede excluir categoria com produtos", async () => {
    const cat = await createCategory("Lírios").expect(201);
    await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: cat.body.id, name: "Lírio Branco" })
      .expect(201);

    await http.delete(`/api/categories/${cat.body.id}`).set(bearer(token)).expect(400);
  });

  it("filtra produtos por categoria e busca", async () => {
    const rosas = await createCategory("Rosas").expect(201);
    const orquideas = await createCategory("Orquídeas").expect(201);
    await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: rosas.body.id, name: "Rosa Vermelha" })
      .expect(201);
    await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: orquideas.body.id, name: "Orquídea Branca" })
      .expect(201);

    const byCat = await http
      .get(`/api/products?categoryId=${rosas.body.id}`)
      .set(bearer(token))
      .expect(200);
    expect(byCat.body.total).toBe(1);
    expect(byCat.body.data[0].name).toBe("Rosa Vermelha");

    const bySearch = await http
      .get("/api/products?search=orqu")
      .set(bearer(token))
      .expect(200);
    expect(bySearch.body.total).toBe(1);

    // Regressão: os seletores de produto (venda rápida, orçamento, compra) pedem
    // pageSize=200 para carregar o catálogo inteiro — não pode ser rejeitado.
    await http
      .get("/api/products?pageSize=200&onlyActive=true")
      .set(bearer(token))
      .expect(200);
  });

  it("isola catálogo por empresa", async () => {
    await createCategory("Rosas").expect(201);
    const other = await registerCompany(http, { email: "outro@catalogo.com" });
    const list = await http
      .get("/api/categories")
      .set(bearer(other.accessToken))
      .expect(200);
    expect(list.body).toHaveLength(0);
  });
});
