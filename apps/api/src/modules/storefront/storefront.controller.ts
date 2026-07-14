import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { storeCheckoutSchema, storeReviewInputSchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Public } from "../../common/auth/public.decorator";
import { StorefrontService } from "./storefront.service";

class StoreCheckoutDto extends createZodDto(storeCheckoutSchema) {}
class StoreReviewDto extends createZodDto(storeReviewInputSchema) {}

/**
 * API pública da loja (@Public pula a autenticação do ERP). O tenant é sempre
 * resolvido no servidor pelo slug; nunca vem do cliente.
 */
@Public()
@Controller("store")
export class StorefrontController {
  constructor(private readonly service: StorefrontService) {}

  @Get(":slug")
  branding(@Param("slug") slug: string) {
    return this.service.branding(slug);
  }

  @Get(":slug/catalog")
  catalog(@Param("slug") slug: string) {
    return this.service.catalog(slug);
  }

  @Post(":slug/checkout")
  checkout(@Param("slug") slug: string, @Body() dto: StoreCheckoutDto) {
    return this.service.checkout(slug, dto);
  }

  @Get(":slug/arrangements/:id/reviews")
  reviews(@Param("slug") slug: string, @Param("id") id: string) {
    return this.service.reviewsFor(slug, id);
  }

  @Post(":slug/arrangements/:id/reviews")
  submitReview(
    @Param("slug") slug: string,
    @Param("id") id: string,
    @Body() dto: StoreReviewDto,
  ) {
    return this.service.submitReview(slug, id, dto);
  }

  /** Webhook do Mercado Pago. `?company=` identifica o tenant. Sempre 200. */
  @Post("webhooks/mercadopago")
  @HttpCode(200)
  async webhook(
    @Query() query: Record<string, string>,
    @Body() body: { type?: string; data?: { id?: string } },
  ) {
    const companyId = query.company;
    const type = body?.type ?? query.type ?? query.topic;
    const paymentId = body?.data?.id ?? query["data.id"] ?? query.id;
    if (type === "payment" && companyId && paymentId) {
      await this.service.handleWebhook(companyId, String(paymentId));
    }
    return { received: true };
  }
}
