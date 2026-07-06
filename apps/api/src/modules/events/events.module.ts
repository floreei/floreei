import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArrangementsModule } from "../arrangements/arrangements.module";
import { CatalogModule } from "../catalog/catalog.module";
import { CustomersModule } from "../customers/customers.module";
import { QuotesModule } from "../quotes/quotes.module";
import { StockModule } from "../stock/stock.module";
import { EventsService } from "./application/events.service";
import { EventAttachmentEntity } from "./infrastructure/event-attachment.entity";
import { EventAttachmentRepository } from "./infrastructure/event-attachment.repository";
import { EventItemEntity } from "./infrastructure/event-item.entity";
import { EventEntity } from "./infrastructure/event.entity";
import { EventRepository } from "./infrastructure/event.repository";
import { EventsController } from "./presentation/events.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      EventAttachmentEntity,
      EventItemEntity,
    ]),
    CustomersModule,
    QuotesModule,
    StockModule,
    CatalogModule,
    ArrangementsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventRepository, EventAttachmentRepository],
  exports: [EventRepository, EventsService],
})
export class EventsModule {}
