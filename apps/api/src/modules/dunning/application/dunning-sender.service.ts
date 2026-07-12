import { Injectable, Logger } from "@nestjs/common";
import { WhatsappService } from "../../../common/whatsapp/whatsapp.service";

export interface SendResult {
  channel: string;
  ok: boolean;
  error?: string;
}

/**
 * Escolhe o canal de envio da cobrança: WhatsApp Cloud API quando configurado,
 * senão apenas registra (canal "log") — deixa a régua rodar ponta a ponta sem
 * depender das credenciais da Meta (dev/teste e Fase 1).
 */
@Injectable()
export class DunningSender {
  private readonly logger = new Logger(DunningSender.name);

  constructor(private readonly whatsapp: WhatsappService) {}

  async send(to: string, text: string): Promise<SendResult> {
    if (this.whatsapp.isConfigured()) {
      try {
        await this.whatsapp.sendText(to, text);
        return { channel: "whatsapp", ok: true };
      } catch (error) {
        return {
          channel: "whatsapp",
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    this.logger.log(`[cobrança:log] ${to} — ${text.slice(0, 60)}…`);
    return { channel: "log", ok: true };
  }
}
