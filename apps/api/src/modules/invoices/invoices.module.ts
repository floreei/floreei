import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoicesService } from "./application/invoices.service";
import { NFE_PROVIDER } from "./application/ports/nfe-provider.port";
import { StubNfeProvider } from "./application/providers/stub-nfe.provider";
import { InvoiceEntity } from "./infrastructure/invoice.entity";
import { InvoiceRepository } from "./infrastructure/invoice.repository";

/**
 * Módulo de nota fiscal. Não importa EventsModule (evita ciclo) — recebe um
 * DTO plano já montado por quem chama (EventsService). Trocar o provedor
 * real por `StubNfeProvider` é trocar só a linha `useClass` abaixo.
 */
@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity])],
  providers: [
    InvoicesService,
    InvoiceRepository,
    { provide: NFE_PROVIDER, useClass: StubNfeProvider },
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
