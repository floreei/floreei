import request from "supertest";
import {
  MercadoPagoBillingClient,
  type MpAuthorizedPayment,
  type MpPreapproval,
  type MpPreapprovalStatus,
} from "../src/modules/billing/mercadopago-billing.client";
import {
  bearer,
  firebaseSignUp,
  registerCompany,
  uniqueEmail,
} from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

/** Mercado Pago em memória: preapprovals + pagamentos de recorrência. */
class FakeMpBillingClient {
  private seq = 0;
  // Ids únicos por rodada: o banco de teste persiste entre execuções e
  // `mp_preapproval_id` tem constraint UNIQUE.
  private readonly run = Date.now().toString(36);
  readonly preapprovals = new Map<
    string,
    { status: MpPreapprovalStatus; amount: number; externalReference: string }
  >();
  readonly payments = new Map<string, MpAuthorizedPayment>();

  async createPreapproval(opts: {
    amount: number;
    externalReference: string;
  }): Promise<MpPreapproval> {
    this.seq += 1;
    const id = `pre_${this.run}_${this.seq}`;
    this.preapprovals.set(id, {
      status: "pending",
      amount: opts.amount,
      externalReference: opts.externalReference,
    });
    return {
      id,
      status: "pending",
      externalReference: opts.externalReference,
      amount: opts.amount,
      initPoint: `https://mp.test/checkout/${id}`,
    };
  }

  async getPreapproval(id: string): Promise<MpPreapproval | null> {
    const row = this.preapprovals.get(id);
    if (!row) return null;
    return {
      id,
      status: row.status,
      externalReference: row.externalReference,
      amount: row.amount,
      initPoint: null,
    };
  }

  async updatePreapprovalAmount(id: string, amount: number): Promise<void> {
    const row = this.preapprovals.get(id);
    if (!row) throw new Error("preapproval não existe");
    row.amount = amount;
  }

  async cancelPreapproval(id: string): Promise<void> {
    const row = this.preapprovals.get(id);
    if (!row) throw new Error("preapproval não existe");
    row.status = "cancelled";
  }

  async getAuthorizedPayment(id: string): Promise<MpAuthorizedPayment | null> {
    return this.payments.get(id) ?? null;
  }

  /** Simula o cliente autorizando a assinatura no checkout do MP. */
  authorize(id: string): void {
    const row = this.preapprovals.get(id);
    if (row) row.status = "authorized";
  }
}

describe("Billing / assinatura Mercado Pago (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let mp: FakeMpBillingClient;
  let token: string;
  let companyId: string;
  let preapprovalId: string;
  let secondPreapprovalId: string;
  let ownerEmail: string;
  let ownerToken: string;
  const auth = () => bearer(token);

  const sql = (q: string, params: unknown[] = []) =>
    ctx.dataSource.query(q, params);

  const webhook = (type: string, id: string) =>
    http
      .post("/api/billing/webhooks/mercadopago")
      .send({ type, data: { id } })
      .expect(200);

  const me = async () => {
    const res = await http.get("/api/auth/me").set(auth()).expect(200);
    return res.body as {
      access: {
        status: string;
        tier: string | null;
        subscriptionStatus: string | null;
        graceDaysLeft: number | null;
        features: string[];
      };
    };
  };

  beforeAll(async () => {
    ownerEmail = uniqueEmail("owner");
    process.env.PLATFORM_OWNER_EMAILS = ownerEmail;
    mp = new FakeMpBillingClient();
    ctx = await createTestApp((builder) =>
      builder.overrideProvider(MercadoPagoBillingClient).useValue(mp),
    );
    http = request(ctx.app.getHttpServer());
    await ctx.resetBusiness();
    const reg = await registerCompany(http, { email: "billing" });
    token = reg.accessToken;
    companyId = reg.user.companyId;
    ownerToken = await firebaseSignUp(ownerEmail, "Segredo123!");
  });
  afterAll(async () => {
    delete process.env.PLATFORM_OWNER_EMAILS;
    await ctx.close();
  });

  it("lista os planos com o preço por usuário", async () => {
    const res = await http.get("/api/billing/plans").set(auth()).expect(200);
    expect(res.body.plans).toHaveLength(3);
    expect(res.body.activeUsers).toBe(1);
    const loja = res.body.plans.find((p: { id: string }) => p.id === "LOJA");
    expect(loja.basePrice).toBe(149);
    expect(loja.userPrice).toBe(16);
  });

  it("assina: cria preapproval PENDING e devolve o checkout", async () => {
    const res = await http
      .post("/api/billing/subscribe")
      .set(auth())
      .send({ tier: "LOJA" })
      .expect(201);
    expect(res.body.initPoint).toContain("https://mp.test/checkout/");
    preapprovalId = res.body.initPoint.split("/").pop();

    const sub = await http
      .get("/api/billing/subscription")
      .set(auth())
      .expect(200);
    expect(sub.body.subscription.status).toBe("PENDING");
    // 149 (base) + 1 usuário × 16
    expect(Number(sub.body.subscription.amount)).toBe(165);
  });

  it("webhook de autorização libera a empresa mesmo com trial vencido", async () => {
    mp.authorize(preapprovalId);
    await webhook("subscription_preapproval", preapprovalId);

    // Trial vencido: só a assinatura sustenta o acesso.
    await sql(
      `UPDATE companies SET plan = 'TRIAL', trial_ends_at = now() - interval '10 days' WHERE id = $1`,
      [companyId],
    );

    await http.get("/api/customers").set(auth()).expect(200);
    const profile = await me();
    expect(profile.access.status).toBe("ACTIVE");
    expect(profile.access.tier).toBe("LOJA");
    expect(profile.access.subscriptionStatus).toBe("AUTHORIZED");
    // Features do plano LOJA valem imediatamente.
    expect(profile.access.features).toContain("STORE");
    expect(profile.access.features).not.toContain("REPORTS");
  });

  it("pagamento rejeitado abre a carência (aviso, sem bloquear)", async () => {
    mp.payments.set("pay_1", {
      preapprovalId,
      paymentStatus: "rejected",
    });
    await webhook("subscription_authorized_payment", "pay_1");

    await http.get("/api/customers").set(auth()).expect(200);
    const profile = await me();
    expect(profile.access.graceDaysLeft).toBe(5);
  });

  it("passada a carência bloqueia com PAYMENT_OVERDUE — mas billing segue acessível", async () => {
    await sql(
      `UPDATE companies SET payment_failed_at = now() - interval '6 days' WHERE id = $1`,
      [companyId],
    );

    const res = await http.get("/api/customers").set(auth());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("PAYMENT_OVERDUE");

    // Rotas de billing continuam abertas para regularizar/reassinar.
    await http.get("/api/billing/plans").set(auth()).expect(200);
  });

  it("pagamento aprovado limpa a pendência e devolve o acesso", async () => {
    mp.payments.set("pay_2", {
      preapprovalId,
      paymentStatus: "approved",
    });
    await webhook("subscription_authorized_payment", "pay_2");

    await http.get("/api/customers").set(auth()).expect(200);
    const profile = await me();
    expect(profile.access.graceDaysLeft).toBeNull();
  });

  it("criar/desativar usuário recalcula o valor da assinatura", async () => {
    const memberEmail = uniqueEmail("membro");
    const created = await http
      .post("/api/users")
      .set(auth())
      .send({
        name: "Membro Extra",
        email: memberEmail,
        password: "Segredo123!",
        role: "OPERATOR",
      })
      .expect(201);

    // 149 + 2 usuários × 16 = 181, refletido no MP e no espelho local.
    expect(mp.preapprovals.get(preapprovalId)?.amount).toBe(181);
    let sub = await http
      .get("/api/billing/subscription")
      .set(auth())
      .expect(200);
    expect(Number(sub.body.subscription.amount)).toBe(181);
    expect(sub.body.subscription.billedUsers).toBe(2);

    await http
      .patch(`/api/users/${created.body.id}`)
      .set(auth())
      .send({ active: false })
      .expect(200);
    expect(mp.preapprovals.get(preapprovalId)?.amount).toBe(165);
    sub = await http
      .get("/api/billing/subscription")
      .set(auth())
      .expect(200);
    expect(sub.body.subscription.billedUsers).toBe(1);
  });

  it("troca de plano: features na hora, valor no próximo ciclo", async () => {
    await http
      .post("/api/billing/change-plan")
      .set(auth())
      .send({ tier: "COMPLETO" })
      .expect(201);

    // 229 + 1 usuário × 16 = 245
    expect(mp.preapprovals.get(preapprovalId)?.amount).toBe(245);
    const profile = await me();
    expect(profile.access.tier).toBe("COMPLETO");
    expect(profile.access.features).toContain("REPORTS");
  });

  it("cancelar abre a carência e depois expira (reassinar)", async () => {
    await http.post("/api/billing/cancel").set(auth()).expect(201);
    expect(mp.preapprovals.get(preapprovalId)?.status).toBe("cancelled");

    // Dentro da carência ainda usa.
    await http.get("/api/customers").set(auth()).expect(200);

    // Passada a carência, cai para EXPIRED (tela de assinar de novo).
    await sql(
      `UPDATE companies SET payment_failed_at = now() - interval '6 days' WHERE id = $1`,
      [companyId],
    );
    const res = await http.get("/api/customers").set(auth());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TRIAL_EXPIRED");

    // E é possível assinar de novo pela tela de bloqueio.
    const again = await http
      .post("/api/billing/subscribe")
      .set(auth())
      .send({ tier: "ESSENCIAL" })
      .expect(201);
    expect(again.body.initPoint).toContain("https://mp.test/checkout/");
    secondPreapprovalId = again.body.initPoint.split("/").pop();
  });

  it("editar o preço do plano no console reaplica nas assinaturas em vigor", async () => {
    // Nova assinatura ESSENCIAL autorizada (79 + 1 usuário × 16 = 95).
    mp.authorize(secondPreapprovalId);
    await webhook("subscription_preapproval", secondPreapprovalId);
    await http.get("/api/customers").set(auth()).expect(200);

    // Gestor OWNER muda o preço-base do plano: 79 → 99.
    await http
      .put("/api/admin/plans/ESSENCIAL")
      .set(bearer(ownerToken))
      .send({ basePrice: 99 })
      .expect(200);

    // Preapproval do assinante atualizado (99 + 16) e espelho local também.
    expect(mp.preapprovals.get(secondPreapprovalId)?.amount).toBe(115);
    const sub = await http
      .get("/api/billing/subscription")
      .set(auth())
      .expect(200);
    expect(Number(sub.body.subscription.amount)).toBe(115);

    // E a vitrine de planos passa a mostrar o preço vigente.
    const plans = await http.get("/api/billing/plans").set(auth()).expect(200);
    const essencial = plans.body.plans.find(
      (p: { id: string }) => p.id === "ESSENCIAL",
    );
    expect(essencial.basePrice).toBe(99);

    // Restaura o padrão para não vazar estado para outras suítes.
    await http
      .put("/api/admin/plans/ESSENCIAL")
      .set(bearer(ownerToken))
      .send({ basePrice: 79 })
      .expect(200);
    expect(mp.preapprovals.get(secondPreapprovalId)?.amount).toBe(95);
  });
});
