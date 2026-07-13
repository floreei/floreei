import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoicesService } from "./application/invoices.service";
import { NFE_PROVIDER } from "./application/ports/nfe-provider.port";
import { FocusNfeProvider } from "./application/providers/focus-nfe.provider";
import { StubNfeProvider } from "./application/providers/stub-nfe.provider";
import { InvoiceEntity } from "./infrastructure/invoice.entity";
import { InvoiceRepository } from "./infrastructure/invoice.repository";
import { InvoicesWebhookController } from "./presentation/invoices-webhook.controller";

/**
 * Módulo de nota fiscal. Não importa EventsModule (evita ciclo) — recebe um
 * DTO plano já montado por quem chama (EventsService). O provedor é plugável:
 * `FocusNfeProvider` quando `FOCUS_NFE_TOKEN` está setado, senão o
 * `StubNfeProvider` (nunca quebra a venda). Trocar/adicionar gateway é mexer
 * só nesta fábrica.
 */
@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity])],
  controllers: [InvoicesWebhookController],
  providers: [
    InvoicesService,
    InvoiceRepository,
    {
      provide: NFE_PROVIDER,
      useFactory: () => {
        const token = process.env.FOCUS_NFE_TOKEN;
        if (token) {
          const baseUrl =
            process.env.FOCUS_NFE_BASE_URL ??
            "https://homologacao.focusnfe.com.br";
          return new FocusNfeProvider(token, baseUrl);
        }
        return new StubNfeProvider();
      },
    },
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
