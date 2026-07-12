import { Injectable, Logger } from "@nestjs/common";

/**
 * Envio via WhatsApp Cloud API (Meta), por um número oficial da Floreei — mesmo
 * padrão do EmailService (REST, sem SDK). Sem as variáveis configuradas vira
 * no-op (`isConfigured()` false) e o remetente cai no canal de log.
 *
 * PRODUÇÃO: mensagem iniciada pela empresa fora da janela de 24h exige um
 * TEMPLATE aprovado pela Meta (categoria utility). Este método envia texto (a
 * fiação da chamada); quando o template estiver aprovado, trocar `type:"text"`
 * por `type:"template"` com os componentes/variáveis.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID,
    );
  }

  /** Envia um texto para um número (E.164, só dígitos). Lança em erro. */
  async sendText(to: string, body: string): Promise<void> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) {
      this.logger.warn("WhatsApp não configurado — mensagem não enviada.");
      return;
    }
    const version = process.env.WHATSAPP_API_VERSION ?? "v21.0";
    const res = await fetch(
      `https://graph.facebook.com/${version}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body, preview_url: true },
        }),
      },
    );
    if (!res.ok) {
      throw new Error(
        `WhatsApp Cloud API: falha (${res.status}) ${await res.text()}`,
      );
    }
  }
}
