import request from "supertest";
import {
  EmailService,
  type EmailMessage,
} from "../src/common/email/email.service";
import {
  bearer,
  firebaseSignUp,
  registerCompany,
  uniqueEmail,
} from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

/** EmailService de teste: guarda o que seria enviado, sem tocar a rede. */
class FakeEmailService {
  readonly sent: EmailMessage[] = [];
  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}

describe("Aviso de novo cadastro (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let email: FakeEmailService;
  let ownerEmail: string;
  let ownerToken: string;
  const notifyTo = "avisos@floreei.test";

  beforeAll(async () => {
    ownerEmail = uniqueEmail("owner");
    process.env.PLATFORM_OWNER_EMAILS = ownerEmail;
    process.env.PLATFORM_NOTIFY_EMAIL = notifyTo;
    email = new FakeEmailService();
    ctx = await createTestApp((builder) =>
      builder.overrideProvider(EmailService).useValue(email),
    );
    http = request(ctx.app.getHttpServer());
    await ctx.reset();
    ownerToken = await firebaseSignUp(ownerEmail, "Segredo123!");
  });

  afterAll(async () => {
    delete process.env.PLATFORM_OWNER_EMAILS;
    delete process.env.PLATFORM_NOTIFY_EMAIL;
    await ctx.close();
  });

  it("novo cadastro dispara e-mail para o operador e notificação no console", async () => {
    const { user } = await registerCompany(http, {
      companyName: "Floricultura Aurora",
      name: "Marina",
    });

    // E-mail ao operador da plataforma.
    const mail = email.sent.find((m) => m.to === notifyTo);
    expect(mail).toBeDefined();
    expect(mail?.subject).toContain("Floricultura Aurora");

    // Notificação no feed do console (badge de não-lidas).
    const list = await http
      .get("/api/admin/notifications")
      .set(bearer(ownerToken))
      .expect(200);
    expect(list.body.unread).toBeGreaterThanOrEqual(1);
    const item = list.body.items.find(
      (n: { companyId: string }) => n.companyId === user.companyId,
    );
    expect(item).toMatchObject({ type: "NEW_COMPANY", read: false });
    expect(item.title).toContain("Floricultura Aurora");

    // Marcar como lidas zera o contador.
    await http
      .post("/api/admin/notifications/read")
      .set(bearer(ownerToken))
      .expect(201);
    const after = await http
      .get("/api/admin/notifications")
      .set(bearer(ownerToken))
      .expect(200);
    expect(after.body.unread).toBe(0);
  });

  it("as notificações são só para gestores (401 sem token)", async () => {
    await http.get("/api/admin/notifications").expect(401);
  });
});
