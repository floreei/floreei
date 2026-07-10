import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Vendas — insights e filtro de pagamento (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "insights" });
    token = reg.accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("GET /events/insights devolve as 4 listas sem erro de SQL", async () => {
    // Uma venda avulsa paga garante que as queries rodam com dados reais.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 150, title: "Venda avulsa", channel: "RETAIL" })
      .expect(201);

    const res = await http.get("/api/events/insights").set(auth()).expect(200);
    expect(res.body).toMatchObject({
      topItems: expect.any(Array),
      idleItems: expect.any(Array),
      topCustomers: expect.any(Array),
      atRiskCustomers: expect.any(Array),
      from: expect.any(String),
      to: expect.any(String),
    });
  });

  it("filtra vendas por situação de pagamento (paga vs pendente)", async () => {
    // Uma venda quitada (recebe o total) e uma a prazo (sem recebimento).
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 100, title: "Paga", channel: "RETAIL" })
      .expect(201);
    await http
      .post(`/api/finance/events/${sale.body.id}/payments`)
      .set(auth())
      .send({ amount: 100, method: "PIX" })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 200, title: "A prazo", channel: "RETAIL" })
      .expect(201);

    const paid = await http
      .get("/api/events")
      .query({ channel: "RETAIL", paymentStatus: "paid" })
      .set(auth())
      .expect(200);
    expect(paid.body.data.length).toBe(1);
    expect(paid.body.data[0].title).toBe("Paga");

    const pending = await http
      .get("/api/events")
      .query({ channel: "RETAIL", paymentStatus: "pending" })
      .set(auth())
      .expect(200);
    expect(pending.body.data.length).toBe(1);
    expect(pending.body.data[0].title).toBe("A prazo");
  });
});
