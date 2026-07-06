import { Controller, Get } from "@nestjs/common";
import { StorefrontService } from "./storefront.service";

/**
 * Pedidos da loja no ERP (backoffice) — autenticado e escopado por tenant pelo
 * guard padrão. Diferente do StorefrontController (@Public), que serve a vitrine.
 */
@Controller("store-orders")
export class StoreOrdersController {
  constructor(private readonly service: StorefrontService) {}

  @Get()
  list() {
    return this.service.listOrders();
  }
}
