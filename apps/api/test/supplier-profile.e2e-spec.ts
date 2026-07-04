import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Perfil do fornecedor (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let supplierId: string;

  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.reset();
    token = (await registerCompany(http, { email: "dono@fp.com" })).accessToken;
    supplierId = (
      await http.post("/api/suppliers").set(auth()).send({ name: "Ceasa" }).expect(201)
    ).body.id;
  });

  it("consolida compras e saldo a pagar do fornecedor", async () => {
    const p = await http
      .post("/api/purchases")
      .set(auth())
      .send({
        supplierId,
        date: "2026-06-10",
        freight: 0,
        items: [{ description: "Rosas", quantity: 100, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201); // total 400
    await http
      .post(`/api/finance/purchases/${p.body.id}/payments`)
      .set(auth())
      .send({ amount: 150 })
      .expect(201);

    const res = await http
      .get(`/api/suppliers/${supplierId}/profile`)
      .set(auth())
      .expect(200);

    expect(res.body.supplier.name).toBe("Ceasa");
    expect(res.body.stats.purchasesCount).toBe(1);
    expect(res.body.stats.totalPurchased).toBe(400);
    expect(res.body.stats.totalPaid).toBe(150);
    expect(res.body.stats.balanceDue).toBe(250);
    expect(res.body.purchases).toHaveLength(1);
  });

  it("não acessa fornecedor de outra empresa", async () => {
    const other = await registerCompany(http, { email: "outro@fp.com" });
    await http
      .get(`/api/suppliers/${supplierId}/profile`)
      .set(bearer(other.accessToken))
      .expect(404);
  });
});
