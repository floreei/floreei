import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

const RUN_TOKEN = "dunning-test-token";

const todayLocal = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

describe("Régua de cobrança (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;

  beforeAll(async () => {
    process.env.DUNNING_RUN_TOKEN = RUN_TOKEN;
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@cobranca.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  it("GET settings devolve o padrão; PUT salva a config", async () => {
    const def = await http.get("/api/dunning/settings").set(bearer(token)).expect(200);
    expect(def.body.enabled).toBe(false);
    expect(def.body.steps.length).toBeGreaterThan(0);

    const saved = await http
      .patch("/api/dunning/settings")
      .set(bearer(token))
      .send({
        enabled: true,
        steps: [{ offsetDays: 0, enabled: true }],
        paymentMethod: "PIX",
        pixKey: "flor@floreei.com.br",
      })
      .expect(200);
    expect(saved.body.enabled).toBe(true);
    expect(saved.body.paymentMethod).toBe("PIX");
  });

  it("run cria log da venda vencida hoje e não duplica; ignora sem contato", async () => {
    // Cliente com WhatsApp + venda fiado vencendo hoje.
    const withPhone = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Ana", whatsapp: "11988887777" })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ amount: 120, customerId: withPhone.body.id, date: todayLocal() })
      .expect(201);
    // Cliente sem contato — deve ser ignorado.
    const noPhone = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Sem Contato" })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ amount: 80, customerId: noPhone.body.id, date: todayLocal() })
      .expect(201);

    await http
      .patch("/api/dunning/settings")
      .set(bearer(token))
      .send({ enabled: true, steps: [{ offsetDays: 0, enabled: true }], paymentMethod: "NONE" })
      .expect(200);

    const run1 = await http
      .post("/api/dunning/run")
      .set(bearer(RUN_TOKEN))
      .expect(200);
    expect(run1.body.processed).toBe(1); // só a Ana (a outra sem contato foi ignorada)
    expect(run1.body.sent).toBe(1);

    const log = await http.get("/api/dunning/log").set(bearer(token)).expect(200);
    expect(log.body).toHaveLength(1);
    expect(log.body[0].customerName).toBe("Ana");
    expect(log.body[0].status).toBe("SENT");
    expect(log.body[0].channel).toBe("log");

    // 2ª rodada não duplica (dedupe por evento+passo).
    const run2 = await http
      .post("/api/dunning/run")
      .set(bearer(RUN_TOKEN))
      .expect(200);
    expect(run2.body.processed).toBe(0);
  });

  it("usa dueDate como referência da régua (não a data da venda)", async () => {
    const cust = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Bia", whatsapp: "11977776666" })
      .expect(201);
    // Vendida há 10 dias, mas vence HOJE → passo 0 deve disparar hoje.
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const pastISO = past.toISOString().slice(0, 10);
    await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ amount: 200, customerId: cust.body.id, date: pastISO, dueDate: todayLocal() })
      .expect(201);
    await http
      .patch("/api/dunning/settings")
      .set(bearer(token))
      .send({ enabled: true, steps: [{ offsetDays: 0, enabled: true }] })
      .expect(200);

    const run = await http.post("/api/dunning/run").set(bearer(RUN_TOKEN)).expect(200);
    expect(run.body.sent).toBe(1);
  });

  it("cobrança manual devolve telefone e mensagem da venda", async () => {
    const cust = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Carla", whatsapp: "11955554444" })
      .expect(201);
    const sale = await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ amount: 90, customerId: cust.body.id, deliveryDate: "2026-10-15" })
      .expect(201);

    const res = await http
      .post(`/api/dunning/send/${sale.body.id}`)
      .set(bearer(token))
      .expect(201);
    expect(res.body.phone).toBe("5511955554444");
    expect(res.body.message).toContain("Carla");
    expect(res.body.message).toContain("pagamento em aberto");
    expect(res.body.message).toContain("90");
    // O link da página pública entra na mensagem (e é devolvido à parte).
    expect(res.body.link).toContain(`/c/${sale.body.id}`);
    expect(res.body.message).toContain(res.body.link);
    // Envio manual não leva o rodapé de descadastro.
    expect(res.body.message).not.toContain("SAIR");
    // A nota vem junto, para o front gerar o PDF sem outra chamada.
    expect(res.body.document.eventId).toBe(sale.body.id);
    expect(res.body.document.link).toBe(res.body.link);
    expect(res.body.document.customerName).toBe("Carla");
    expect(res.body.document.amountDue).toBe(90);
    // Data de entrega vai na nota (nome do arquivo baixado usa ela).
    expect(res.body.document.deliveryDate).toBe("2026-10-15");

    // Página pública (sem auth) devolve os dados da cobrança.
    const pub = await http.get(`/api/dunning/public/${sale.body.id}`).expect(200);
    expect(pub.body.customerName).toBe("Carla");
    expect(pub.body.amountDue).toBe(90);
    expect(pub.body.reference).toHaveLength(8);

    // Venda quitada → recusa.
    await http
      .post(`/api/finance/events/${sale.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 90, method: "PIX" })
      .expect(201);
    await http
      .post(`/api/dunning/send/${sale.body.id}`)
      .set(bearer(token))
      .expect(400);
  });

  it("exporta as notas de cobrança em lote: só vendas em aberto do próprio tenant", async () => {
    const cust = await http
      .post("/api/customers")
      .set(bearer(token))
      .send({ name: "Mercado Flor" })
      .expect(201);
    const quick = (body: Record<string, unknown>) =>
      http.post("/api/events/quick").set(bearer(token)).send(body).expect(201);
    const open1 = await quick({ amount: 100, customerId: cust.body.id, channel: "WHOLESALE" });
    const open2 = await quick({ amount: 200, customerId: cust.body.id, channel: "WHOLESALE" });
    const paid = await quick({ amount: 50, customerId: cust.body.id, channel: "WHOLESALE" });
    await http
      .post(`/api/finance/events/${paid.body.id}/payments`)
      .set(bearer(token))
      .send({ amount: 50, method: "PIX" })
      .expect(201);

    // Venda de OUTRA empresa: nunca sai, mesmo com o id em mãos.
    const other = (await registerCompany(http, { email: "outra@cobranca.com" }))
      .accessToken;
    const foreign = await http
      .post("/api/events/quick")
      .set(bearer(other))
      .send({ amount: 999 })
      .expect(201);

    const res = await http
      .post("/api/dunning/documents")
      .set(bearer(token))
      .send({ eventIds: [open1.body.id, open2.body.id, paid.body.id, foreign.body.id] })
      .expect(201);

    const ids = res.body.documents.map((d: { eventId: string }) => d.eventId);
    expect(ids).toEqual([open1.body.id, open2.body.id]);
    const first = res.body.documents[0];
    expect(first.link).toContain(`/c/${open1.body.id}`);
    expect(first.customerName).toBe("Mercado Flor");
    expect(first.amountDue).toBe(100);
    expect(first.reference).toHaveLength(8);
    // Sem data de entrega combinada, o campo vem null (o front cai na data da venda).
    expect(first.deliveryDate).toBeNull();
    // Exportar não marca a venda como cobrada — isso é do botão "Cobrar".
    const ev = await http.get(`/api/events/${open1.body.id}`).set(bearer(token)).expect(200);
    expect(ev.body.chargedAt).toBeNull();
  });

  it("bloqueia /dunning/run sem token", async () => {
    await http.post("/api/dunning/run").expect(401);
  });
});
