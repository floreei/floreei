import { Injectable, Logger } from "@nestjs/common";

const RESEND_API = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Envio transacional de e-mail via Resend (REST, sem SDK — mesmo padrão do
 * client do Mercado Pago). Modular: se amanhã trocarmos de provedor, só este
 * arquivo muda. Sem `RESEND_API_KEY` (dev/testes) vira no-op logado — nunca
 * lança, para não derrubar o fluxo que apenas notifica.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /** Remetente padrão; precisa ser de um domínio verificado no Resend. */
  private from(): string {
    return process.env.EMAIL_FROM ?? "Floreei <nao-responda@floreei.com.br>";
  }

  async send(message: EmailMessage): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY ausente — e-mail não enviado (assunto: "${message.subject}").`,
      );
      return;
    }

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from(),
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Resend: falha ao enviar e-mail (${res.status}) ${await res.text()}`,
      );
    }
  }
}
