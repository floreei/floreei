import { Controller, Get, Module, Query } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { reportQuerySchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { EventsModule } from "../events/events.module";
import { FinanceModule } from "../finance/finance.module";
import { PurchasesModule } from "../purchases/purchases.module";
import { QuoteItemEntity } from "../quotes/infrastructure/quote-item.entity";
import { ReportsService } from "./reports.service";

class ReportQueryDto extends createZodDto(reportQuerySchema) {}

@Controller("reports")
class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  generate(@Query() query: ReportQueryDto) {
    return this.reports.generate(query.from, query.to);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteItemEntity]),
    EventsModule,
    PurchasesModule,
    FinanceModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
