import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Nota fiscal (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let companyId: string;
  const auth = () => bearer(token);

  const setCompany = (sql: string) =>
    ctx.dataSource.query(`UPDATE companies SET ${sql} WHERE id = $1`, [
      companyId,
    ]);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "notafiscal" });
    token = reg.accessToken;
    companyId = reg.user.companyId;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    // Empresa recém-registrada fica em TRIAL (libera tudo, inclusive INVOICING).
  });

  it("emite (rejeitada pelo stub) numa venda direta e deriva NFC-e", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 100, title: "Venda avulsa", channel: "RETAIL" })
      .expect(201);

    const invoice = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(201);

    expect(invoice.body.documentType).toBe("NFCE");
    expect(invoice.body.status).toBe("REJECTED");
    expect(invoice.body.rejectionReason).toMatch(/não configurado/i);
  });

  it("deriva NF-e numa venda no atacado", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 200, title: "Venda atacado", channel: "WHOLESALE" })
      .expect(201);

    const invoice = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(201);

    expect(invoice.body.documentType).toBe("NFE");
  });

  it("duas emissões geram duas linhas; GET /invoice devolve a mais recente", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 50, title: "Venda", channel: "RETAIL" })
      .expect(201);

    const first = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(201);
    const second = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(201);

    const history = await http
      .get(`/api/events/${sale.body.id}/invoices`)
      .set(auth())
      .expect(200);
    expect(history.body).toHaveLength(2);

    const latest = await http
      .get(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(200);
    expect(latest.body.id).toBe(second.body.id);
    expect(latest.body.id).not.toBe(first.body.id);
  });

  it("não permite cancelar uma nota que não está autorizada", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 50, title: "Venda", channel: "RETAIL" })
      .expect(201);
    await http.post(`/api/events/${sale.body.id}/invoice`).set(auth()).expect(201);

    await http
      .post(`/api/events/${sale.body.id}/invoice/cancel`)
      .set(auth())
      .send({ reason: "Motivo de teste" })
      .expect(400);
  });

  it("emissão automática dispara sozinha ao fechar a venda", async () => {
    await setCompany("invoice_auto_emit = true");

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 80, title: "Venda auto", channel: "RETAIL" })
      .expect(201);

    const invoice = await http
      .get(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(200);
    expect(invoice.body).not.toBeNull();
    expect(invoice.body.status).toBe("REJECTED");
  });

  it("sem a feature INVOICING: 403 nas rotas de nota, mas a venda continua acessível", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 50, title: "Venda", channel: "RETAIL" })
      .expect(201);

    await setCompany(
      "plan = 'ACTIVE', tier = 'ESSENCIAL', feature_overrides = '{}'",
    );

    await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(403);
    await http.get(`/api/events/${sale.body.id}`).set(auth()).expect(200);

    await setCompany("plan = 'TRIAL', tier = NULL, feature_overrides = '{}'");
  });

  it("NF-e no atacado sem endereço fiscal do cliente é bloqueada com mensagem clara", async () => {
    const customer = await http
      .post("/api/customers")
      .set(auth())
      .send({ name: "Lojista sem endereço", channel: "WHOLESALE", document: "11222333000181" })
      .expect(201);

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        amount: 300,
        title: "Atacado",
        channel: "WHOLESALE",
        customerId: customer.body.id,
      })
      .expect(201);

    const res = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(400);
    expect(res.body.message).toMatch(/endereço fiscal/i);
  });

  it("com endereço fiscal preenchido, a NF-e no atacado prossegue (rejeitada pelo stub)", async () => {
    const customer = await http
      .post("/api/customers")
      .set(auth())
      .send({
        name: "Lojista SP",
        channel: "WHOLESALE",
        document: "11222333000181",
        addressStreet: "Av. Paulista",
        addressNumber: "1000",
        addressNeighborhood: "Bela Vista",
        addressCity: "São Paulo",
        addressState: "SP",
        addressZip: "01310100",
        cityCode: "3550308",
      })
      .expect(201);

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        amount: 300,
        title: "Atacado",
        channel: "WHOLESALE",
        customerId: customer.body.id,
      })
      .expect(201);

    const invoice = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(201);
    expect(invoice.body.documentType).toBe("NFE");
    expect(invoice.body.status).toBe("REJECTED");
  });

  it("refresh devolve a nota vigente (sem provedor, não muda de estado)", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 50, title: "Venda", channel: "RETAIL" })
      .expect(201);
    const invoice = await http
      .post(`/api/events/${sale.body.id}/invoice`)
      .set(auth())
      .expect(201);

    const refreshed = await http
      .post(`/api/events/${sale.body.id}/invoice/refresh`)
      .set(auth())
      .expect(200);
    expect(refreshed.body.id).toBe(invoice.body.id);
    expect(refreshed.body.status).toBe("REJECTED");
  });

  it("não permite excluir uma venda com nota fiscal emitida", async () => {
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ amount: 50, title: "Venda", channel: "RETAIL" })
      .expect(201);
    await http.post(`/api/events/${sale.body.id}/invoice`).set(auth()).expect(201);

    await http.delete(`/api/events/${sale.body.id}`).set(auth()).expect(400);
  });
});
