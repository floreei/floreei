import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "../catalog/catalog.module";
import { StockModule } from "../stock/stock.module";
import { StoreRevalidationModule } from "../storefront/store-revalidation.module";
import { ArrangementsService } from "./application/arrangements.service";
import { ArrangementItemEntity } from "./infrastructure/arrangement-item.entity";
import { ArrangementEntity } from "./infrastructure/arrangement.entity";
import { ArrangementRepository } from "./infrastructure/arrangement.repository";
import { ArrangementsController } from "./presentation/arrangements.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([ArrangementEntity, ArrangementItemEntity]),
    CatalogModule,
    StockModule,
    StoreRevalidationModule,
  ],
  controllers: [ArrangementsController],
  providers: [ArrangementsService, ArrangementRepository],
  exports: [ArrangementsService, ArrangementRepository],
})
export class ArrangementsModule {}
