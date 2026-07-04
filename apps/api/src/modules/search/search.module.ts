import { Controller, Get, Module, Query } from "@nestjs/common";
import { searchQuerySchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { CatalogModule } from "../catalog/catalog.module";
import { CustomersModule } from "../customers/customers.module";
import { EventsModule } from "../events/events.module";
import { PurchasesModule } from "../purchases/purchases.module";
import { QuotesModule } from "../quotes/quotes.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { SearchService } from "./search.service";

class SearchQueryDto extends createZodDto(searchQuerySchema) {}

@Controller("search")
class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  query(@Query() query: SearchQueryDto) {
    return this.search.search(query.q);
  }
}

@Module({
  imports: [
    CustomersModule,
    EventsModule,
    QuotesModule,
    CatalogModule,
    SuppliersModule,
    PurchasesModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
