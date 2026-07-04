import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Perfil do cliente (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let customerId: string;

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
    token = (await registerCompany(http, { email: "dono@perfil.com" })).accessToken;
    customerId = (
      await http.post("/api/customers").set(auth()).send({ name: "Ana" }).expect(201)
    ).body.id;
  });

  it("consolida histórico e saldo do cliente", async () => {
    const e1 = await http
      .post("/api/events")
      .set(auth())
      .send({ customerId, title: "Casamento", date: "2026-06-10", soldValue: 1000 })
      .expect(201);
    await http
      .post(`/api/finance/events/${e1.body.id}/payments`)
      .set(auth())
      .send({ amount: 400 })
      .expect(201);
    await http
      .post("/api/events")
      .set(auth())
      .send({ customerId, title: "Aniversário", date: "2026-07-10", soldValue: 500 })
      .expect(201);

    const res = await http
      .get(`/api/customers/${customerId}/profile`)
      .set(auth())
      .expect(200);

    expect(res.body.customer.name).toBe("Ana");
    expect(res.body.stats.eventsCount).toBe(2);
    expect(res.body.stats.totalSold).toBe(1500);
    expect(res.body.stats.totalReceived).toBe(400);
    expect(res.body.stats.balanceDue).toBe(1100);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events[0].title).toBe("Aniversário"); // mais recente primeiro
  });

  it("não acessa cliente de outra empresa", async () => {
    const other = await registerCompany(http, { email: "outro@perfil.com" });
    await http
      .get(`/api/customers/${customerId}/profile`)
      .set(bearer(other.accessToken))
      .expect(404);
  });
});
