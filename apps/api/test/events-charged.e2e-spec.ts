import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

const RUN_TOKEN = "charged-test-token";

const todayLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

describe("Vendas — marcação de cobrada (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  const quickSale = async (body: Record<string, unknown>) =>
    (await http.post("/api/events/quick").set(auth()).send(body).expect(201)).body;
  const titles = (res: { body: { data: Array<{ title: string }> } }) =>
    res.body.data.map((e) => e.title).sort();

  beforeAll(async () => {
    process.env.DUNNING_RUN_TOKEN = RUN_TOKEN;
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "cobrada" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("PATCH charged marca e desmarca a venda como cobrada", async () => {
    const sale = await quickSale({ amount: 100, title: "A prazo", channel: "WHOLESALE" });
    expect(sale.chargedAt).toBeNull();

    const marked = await http
      .patch(`/api/events/${sale.id}`)
      .set(auth())
      .send({ charged: true })
      .expect(200);
    expect(Date.parse(marked.body.chargedAt)).not.toBeNaN();
    // Só a marcação muda — valores e situação da venda ficam como estavam.
    expect(marked.body).toMatchObject({
      soldValue: 100,
      status: sale.status,
      estimatedProfit: sale.estimatedProfit,
    });

    // Marcar de novo preserva a data da primeira cobrança.
    const again = await http
      .patch(`/api/events/${sale.id}`)
      .set(auth())
      .send({ charged: true })
      .expect(200);
    expect(again.body.chargedAt).toBe(marked.body.chargedAt);

    const cleared = await http
      .patch(`/api/events/${sale.id}`)
      .set(auth())
      .send({ charged: false })
      .expect(200);
    expect(cleared.body.chargedAt).toBeNull();
  });

  it("filtro charged separa cobradas e a cobrar, só entre vendas em aberto", async () => {
    const cobrada = await quickSale({ amount: 100, title: "Cobrada", channel: "RETAIL" });
    await quickSale({ amount: 200, title: "A cobrar", channel: "RETAIL" });
    const quitada = await quickSale({ amount: 50, title: "Quitada", channel: "RETAIL" });
    const cancelada = await quickSale({ amount: 70, title: "Cancelada", channel: "RETAIL" });

    await http
      .patch(`/api/events/${cobrada.id}`)
      .set(auth())
      .send({ charged: true })
      .expect(200);
    // Cobrada e depois paga: sai dos dois filtros (não há mais o que cobrar).
    await http
      .patch(`/api/events/${quitada.id}`)
      .set(auth())
      .send({ charged: true })
      .expect(200);
    await http
      .post(`/api/finance/events/${quitada.id}/payments`)
      .set(auth())
      .send({ amount: 50, method: "PIX" })
      .expect(201);
    await http.post(`/api/events/${cancelada.id}/cancel`).set(auth()).expect(200);

    const charged = await http
      .get("/api/events")
      .query({ channel: "RETAIL", charged: true })
      .set(auth())
      .expect(200);
    expect(titles(charged)).toEqual(["Cobrada"]);

    const toCharge = await http
      .get("/api/events")
      .query({ channel: "RETAIL", charged: false })
      .set(auth())
      .expect(200);
    expect(titles(toCharge)).toEqual(["A cobrar"]);

    const all = await http
      .get("/api/events")
      .query({ channel: "RETAIL" })
      .set(auth())
      .expect(200);
    expect(all.body.data).toHaveLength(4);
  });

  it("insights respeitam o filtro charged", async () => {
    const ana = (
      await http.post("/api/customers").set(auth()).send({ name: "Ana Cobrada" }).expect(201)
    ).body;
    const beto = (
      await http.post("/api/customers").set(auth()).send({ name: "Beto A Cobrar" }).expect(201)
    ).body;
    const cobrada = await quickSale({ amount: 100, customerId: ana.id, channel: "RETAIL" });
    await quickSale({ amount: 200, customerId: beto.id, channel: "RETAIL" });
    await http
      .patch(`/api/events/${cobrada.id}`)
      .set(auth())
      .send({ charged: true })
      .expect(200);

    const customerIds = async (charged: boolean) =>
      (
        await http
          .get("/api/events/insights")
          .query({ channel: "RETAIL", charged })
          .set(auth())
          .expect(200)
      ).body.topCustomers.map((c: { id: string }) => c.id);

    expect(await customerIds(true)).toEqual([ana.id]);
    expect(await customerIds(false)).toEqual([beto.id]);
  });

  it("cobrança manual (WhatsApp) já marca a venda como cobrada", async () => {
    const cust = (
      await http
        .post("/api/customers")
        .set(auth())
        .send({ name: "Carla", whatsapp: "11955554444" })
        .expect(201)
    ).body;
    const sale = await quickSale({ amount: 90, customerId: cust.id });

    await http.post(`/api/dunning/send/${sale.id}`).set(auth()).expect(201);

    const after = await http.get(`/api/events/${sale.id}`).set(auth()).expect(200);
    expect(Date.parse(after.body.chargedAt)).not.toBeNaN();
  });

  it("régua automática marca como cobrada a venda cujo lembrete foi enviado", async () => {
    const cust = (
      await http
        .post("/api/customers")
        .set(auth())
        .send({ name: "Ana", whatsapp: "11988887777" })
        .expect(201)
    ).body;
    const sale = await quickSale({ amount: 120, customerId: cust.id, date: todayLocal() });
    const other = await quickSale({ amount: 80, title: "Sem contato", date: todayLocal() });

    await http
      .patch("/api/dunning/settings")
      .set(auth())
      .send({ enabled: true, steps: [{ offsetDays: 0, enabled: true }], paymentMethod: "NONE" })
      .expect(200);
    const run = await http.post("/api/dunning/run").set(bearer(RUN_TOKEN)).expect(200);
    expect(run.body.sent).toBe(1);

    const charged = await http.get(`/api/events/${sale.id}`).set(auth()).expect(200);
    expect(Date.parse(charged.body.chargedAt)).not.toBeNaN();
    // Venda que a régua não alcançou segue "a cobrar".
    const untouched = await http.get(`/api/events/${other.id}`).set(auth()).expect(200);
    expect(untouched.body.chargedAt).toBeNull();
  });
});
