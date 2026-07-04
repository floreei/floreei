import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomersModule } from "../customers/customers.module";
import { QuotesService } from "./application/quotes.service";
import { QuoteItemEntity } from "./infrastructure/quote-item.entity";
import { QuoteEntity } from "./infrastructure/quote.entity";
import { QuoteRepository } from "./infrastructure/quote.repository";
import { QuotesController } from "./presentation/quotes.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([QuoteEntity, QuoteItemEntity]),
    CustomersModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService, QuoteRepository],
  exports: [QuoteRepository],
})
export class QuotesModule {}
