import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { CatalogModule } from "../catalog/catalog.module";
import { CustomersModule } from "../customers/customers.module";
import { EventsModule } from "../events/events.module";
import { FinanceModule } from "../finance/finance.module";
import { PurchasesModule } from "../purchases/purchases.module";
import { ReportsModule } from "../reports/reports.module";
import { StockModule } from "../stock/stock.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { AI_PROVIDER, NullAiProvider } from "./ai/ai-provider";
import { AnthropicAiProvider } from "./ai/anthropic.provider";
import { FakeAiProvider } from "./ai/fake.provider";
import { AssistantUsageService } from "./application/assistant-usage.service";
import { AssistantService } from "./application/assistant.service";
import { AssistantTools } from "./application/assistant.tools";
import { AssistantUsageEntity } from "./infrastructure/assistant-usage.entity";
import { AssistantController } from "./presentation/assistant.controller";

/**
 * Assistente de IA (v1 — compras). Reusa os serviços de Fornecedores, Catálogo e
 * Compras. Provedor de IA plugável: Anthropic quando há `ANTHROPIC_API_KEY`;
 * senão, `FakeAiProvider` (dev/testes) ou indisponível em produção.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AssistantUsageEntity, CompanyEntity]),
    SuppliersModule,
    CatalogModule,
    CustomersModule,
    PurchasesModule,
    EventsModule,
    FinanceModule,
    ReportsModule,
    StockModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantUsageService,
    AssistantTools,
    {
      provide: AI_PROVIDER,
      useFactory: () => {
        const key = process.env.ANTHROPIC_API_KEY;
        if (key) return new AnthropicAiProvider(key);
        if (process.env.NODE_ENV === "production") return new NullAiProvider();
        return new FakeAiProvider();
      },
    },
  ],
  exports: [AssistantUsageService],
})
export class AssistantModule {}
