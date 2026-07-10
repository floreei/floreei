import { Controller, Get, Query } from "@nestjs/common";
import { storeOrderQuerySchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../common/auth/feature.guard";
import { StorefrontService } from "./storefront.service";

class StoreOrderQueryDto extends createZodDto(storeOrderQuerySchema) {}

/**
 * Pedidos da loja no ERP (backoffice) — autenticado e escopado por tenant pelo
 * guard padrão. Diferente do StorefrontController (@Public), que serve a vitrine.
 */
@RequiresFeature("STORE")
@Controller("store-orders")
export class StoreOrdersController {
  constructor(private readonly service: StorefrontService) {}

  @Get()
  list(@Query() query: StoreOrderQueryDto) {
    return this.service.listOrders(query);
  }
}
