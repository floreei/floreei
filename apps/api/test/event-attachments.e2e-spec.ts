import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Anexos de evento (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let eventId: string;

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
    token = (await registerCompany(http, { email: "dono@anexo.com" })).accessToken;
    const customer = await http
      .post("/api/customers")
      .set(auth())
      .send({ name: "Ana" })
      .expect(201);
    eventId = (
      await http
        .post("/api/events")
        .set(auth())
        .send({ customerId: customer.body.id, title: "Casamento", date: "2026-07-01" })
        .expect(201)
    ).body.id;
  });

  it("adiciona, lista e remove anexos (links)", async () => {
    const created = await http
      .post(`/api/events/${eventId}/attachments`)
      .set(auth())
      .send({ label: "Referências", url: "https://pinterest.com/board/x" })
      .expect(201);
    expect(created.body.label).toBe("Referências");

    const list = await http
      .get(`/api/events/${eventId}/attachments`)
      .set(auth())
      .expect(200);
    expect(list.body).toHaveLength(1);

    await http
      .delete(`/api/events/attachments/${created.body.id}`)
      .set(auth())
      .expect(204);

    const after = await http
      .get(`/api/events/${eventId}/attachments`)
      .set(auth())
      .expect(200);
    expect(after.body).toHaveLength(0);
  });

  it("valida URL inválida", async () => {
    await http
      .post(`/api/events/${eventId}/attachments`)
      .set(auth())
      .send({ label: "X", url: "não-é-url" })
      .expect(400);
  });

  it("isola anexos por empresa", async () => {
    await http
      .post(`/api/events/${eventId}/attachments`)
      .set(auth())
      .send({ label: "Ref", url: "https://drive.google.com/x" })
      .expect(201);

    const other = await registerCompany(http, { email: "outro@anexo.com" });
    await http
      .get(`/api/events/${eventId}/attachments`)
      .set(bearer(other.accessToken))
      .expect(404); // evento não pertence à outra empresa
  });
});
