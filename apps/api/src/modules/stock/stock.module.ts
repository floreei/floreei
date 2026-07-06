import {
  Body,
  Controller,
  Get,
  Module,
  Post,
  Query,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  stockAdjustSchema,
  stockMovementInputSchema,
  stockMovementQuerySchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { CatalogModule } from "../catalog/catalog.module";
import { StockService } from "./application/stock.service";
import { StockMovementEntity } from "./infrastructure/stock-movement.entity";
import { StockMovementRepository } from "./infrastructure/stock-movement.repository";

class StockMovementInputDto extends createZodDto(stockMovementInputSchema) {}
class StockMovementQueryDto extends createZodDto(stockMovementQuerySchema) {}
class StockAdjustDto extends createZodDto(stockAdjustSchema) {}

@Controller("stock")
class StockController {
  constructor(private readonly stock: StockService) {}

  @Get("overview")
  overview() {
    return this.stock.overview();
  }

  @Get("movements")
  movements(@Query() query: StockMovementQueryDto) {
    return this.stock.list(query.productId);
  }

  @Post("movements")
  register(@Body() dto: StockMovementInputDto) {
    return this.stock.registerManual(dto);
  }

  @Post("adjust")
  adjust(@Body() dto: StockAdjustDto) {
    return this.stock.adjustBalance(dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([StockMovementEntity]), CatalogModule],
  controllers: [StockController],
  providers: [StockService, StockMovementRepository],
  exports: [StockService],
})
export class StockModule {}
