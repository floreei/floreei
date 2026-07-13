import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { ArrangementsModule } from "../arrangements/arrangements.module";
import { CatalogModule } from "../catalog/catalog.module";
import { CustomersModule } from "../customers/customers.module";
import { EventsModule } from "../events/events.module";
import { ExpensesModule } from "../expenses/expenses.module";
import { FinanceModule } from "../finance/finance.module";
import { PurchasesModule } from "../purchases/purchases.module";
import { ReportsModule } from "../reports/reports.module";
import { StockModule } from "../stock/stock.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { AI_PROVIDER, NullAiProvider } from "./ai/ai-provider";
import { AnthropicAiProvider } from "./ai/anthropic.provider";
import { FakeAiProvider } from "./ai/fake.provider";
import { AssistantHistoryService } from "./application/assistant-history.service";
import { AssistantUsageService } from "./application/assistant-usage.service";
import { AssistantService } from "./application/assistant.service";
import { AssistantTools } from "./application/assistant.tools";
import { AssistantActionEntity } from "./infrastructure/assistant-action.entity";
import { AssistantConversationEntity } from "./infrastructure/assistant-conversation.entity";
import { AssistantMessageEntity } from "./infrastructure/assistant-message.entity";
import { AssistantUsageEntity } from "./infrastructure/assistant-usage.entity";
import { AssistantController } from "./presentation/assistant.controller";

/**
 * Assistente de IA (v1 — compras). Reusa os serviços de Fornecedores, Catálogo e
 * Compras. Provedor de IA plugável: Anthropic quando há `ANTHROPIC_API_KEY`;
 * senão, `FakeAiProvider` (dev/testes) ou indisponível em produção.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssistantUsageEntity,
      AssistantConversationEntity,
      AssistantMessageEntity,
      AssistantActionEntity,
      CompanyEntity,
    ]),
    SuppliersModule,
    CatalogModule,
    CustomersModule,
    PurchasesModule,
    EventsModule,
    FinanceModule,
    ReportsModule,
    StockModule,
    ArrangementsModule,
    ExpensesModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantUsageService,
    AssistantHistoryService,
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
  exports: [AssistantUsageService, AssistantHistoryService],
})
export class AssistantModule {}
