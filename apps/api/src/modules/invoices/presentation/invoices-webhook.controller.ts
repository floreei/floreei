import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { Public } from "../../../common/auth/public.decorator";
import { InvoicesService } from "../application/invoices.service";
import { FocusWebhookGuard } from "./focus-webhook.guard";

/**
 * Recebe o callback assíncrono do Focus NFe quando a nota muda de estado
 * (autorizada/rejeitada). Rota pública (sem usuário logado), protegida por
 * segredo na URL; a nota é localizada pela `ref` (id do InvoiceEntity) e o
 * status autoritativo é reconsultado no provedor.
 */
@Public()
@Controller("webhooks")
export class InvoicesWebhookController {
  constructor(private readonly invoices: InvoicesService) {}

  @UseGuards(FocusWebhookGuard)
  @Post("focus-nfe")
  @HttpCode(200)
  async focusNfe(@Body() body: { ref?: string }): Promise<{ ok: true }> {
    if (body?.ref) {
      await this.invoices.applyStatusByRef(body.ref);
    }
    return { ok: true };
  }
}
