import { Injectable } from "@nestjs/common";

/**
 * Client REST das assinaturas (preapproval) do Mercado Pago, usando o token da
 * PLATAFORMA (`MP_PLATFORM_ACCESS_TOKEN`) — a mensalidade do SaaS cai na conta
 * da Floreei, diferente da loja online, que usa o token de cada floricultura.
 * Injetável para os e2e substituírem por um mock.
 */
const MP_API = "https://api.mercadopago.com";

/** Status do preapproval como o MP devolve. */
export type MpPreapprovalStatus =
  | "pending"
  | "authorized"
  | "paused"
  | "cancelled";

export interface MpPreapproval {
  id: string;
  status: MpPreapprovalStatus;
  externalReference: string | null;
  amount: number;
  initPoint: string | null;
}

export interface MpAuthorizedPayment {
  preapprovalId: string | null;
  /** Status do pagamento da recorrência: approved | rejected | ... */
  paymentStatus: string | null;
}

@Injectable()
export class MercadoPagoBillingClient {
  private token(): string {
    const token = process.env.MP_PLATFORM_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MP_PLATFORM_ACCESS_TOKEN não configurado.");
    }
    return token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${MP_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token()}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(
        `Mercado Pago: ${init?.method ?? "GET"} ${path} falhou (${res.status}) ${await res.text()}`,
      );
    }
    return (await res.json()) as T;
  }

  /** Cria a assinatura pendente; o cliente autoriza no `initPoint`. */
  async createPreapproval(opts: {
    reason: string;
    amount: number;
    externalReference: string;
    payerEmail: string;
    backUrl: string;
  }): Promise<MpPreapproval> {
    const data = await this.request<{
      id: string;
      status: MpPreapprovalStatus;
      external_reference: string | null;
      init_point: string | null;
      auto_recurring?: { transaction_amount?: number };
    }>("/preapproval", {
      method: "POST",
      body: JSON.stringify({
        reason: opts.reason,
        external_reference: opts.externalReference,
        payer_email: opts.payerEmail,
        back_url: opts.backUrl,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: opts.amount,
          currency_id: "BRL",
        },
        status: "pending",
      }),
    });
    return this.toPreapproval(data);
  }

  /** Consulta autoritativa — usada no webhook e nas conferências. */
  async getPreapproval(id: string): Promise<MpPreapproval | null> {
    try {
      const data = await this.request<{
        id: string;
        status: MpPreapprovalStatus;
        external_reference: string | null;
        init_point: string | null;
        auto_recurring?: { transaction_amount?: number };
      }>(`/preapproval/${id}`);
      return this.toPreapproval(data);
    } catch {
      return null;
    }
  }

  /** Atualiza o valor mensal (vale a partir da próxima cobrança). */
  async updatePreapprovalAmount(id: string, amount: number): Promise<void> {
    await this.request(`/preapproval/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        auto_recurring: { transaction_amount: amount, currency_id: "BRL" },
      }),
    });
  }

  async cancelPreapproval(id: string): Promise<void> {
    await this.request(`/preapproval/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    });
  }

  /** Pagamento de uma recorrência (webhook `subscription_authorized_payment`). */
  async getAuthorizedPayment(id: string): Promise<MpAuthorizedPayment | null> {
    try {
      const data = await this.request<{
        preapproval_id?: string;
        payment?: { status?: string };
        status?: string;
      }>(`/authorized_payments/${id}`);
      return {
        preapprovalId: data.preapproval_id ?? null,
        paymentStatus: data.payment?.status ?? data.status ?? null,
      };
    } catch {
      return null;
    }
  }

  private toPreapproval(data: {
    id: string;
    status: MpPreapprovalStatus;
    external_reference: string | null;
    init_point: string | null;
    auto_recurring?: { transaction_amount?: number };
  }): MpPreapproval {
    return {
      id: data.id,
      status: data.status,
      externalReference: data.external_reference,
      amount: data.auto_recurring?.transaction_amount ?? 0,
      initPoint: data.init_point,
    };
  }
}
