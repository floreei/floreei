import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArrangementsModule } from "../arrangements/arrangements.module";
import { CompanyModule } from "../companies/company.module";
import { CustomersModule } from "../customers/customers.module";
import { EventsModule } from "../events/events.module";
import { StoreOrderEntity } from "./infrastructure/store-order.entity";
import { StoreOrderRepository } from "./infrastructure/store-order.repository";
import { StoreOrdersController } from "./store-orders.controller";
import { StorefrontController } from "./storefront.controller";
import { StorefrontService } from "./storefront.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreOrderEntity]),
    CompanyModule,
    ArrangementsModule,
    CustomersModule,
    EventsModule,
  ],
  controllers: [StorefrontController, StoreOrdersController],
  providers: [StorefrontService, StoreOrderRepository],
  exports: [StorefrontService],
})
export class StorefrontModule {}
