import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { subscribeSchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { AllowBlockedCompany } from "../../../common/auth/allow-blocked-company.decorator";
import type { AuthUser } from "../../../common/auth/auth-user";
import { CurrentUser } from "../../../common/auth/current-user.decorator";
import { Public } from "../../../common/auth/public.decorator";
import { Roles } from "../../../common/auth/roles.decorator";
import { BillingService } from "../application/billing.service";

class SubscribeDto extends createZodDto(subscribeSchema) {}

/**
 * Assinatura da plataforma — leitura para todos, ações só do administrador.
 * Acessível mesmo com a empresa bloqueada (é como ela volta a pagar).
 */
@AllowBlockedCompany()
@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Planos vigentes para a landing (estática) — sem autenticação. */
  @Public()
  @Get("public-plans")
  publicPlans() {
    return this.billing.publicPlans();
  }

  @Get("plans")
  plans() {
    return this.billing.plans();
  }

  @Get("subscription")
  subscription() {
    return this.billing.summary();
  }

  /** Uso da empresa no trial + plano recomendado (tela de fim de trial). */
  @Get("trial-summary")
  trialSummary() {
    return this.billing.trialSummary();
  }

  @Roles("ADMIN")
  @Post("subscribe")
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: AuthUser) {
    return this.billing.subscribe(dto.tier, user.email);
  }

  @Roles("ADMIN")
  @Post("change-plan")
  changePlan(@Body() dto: SubscribeDto) {
    return this.billing.changePlan(dto.tier);
  }

  @Roles("ADMIN")
  @Post("cancel")
  async cancel() {
    await this.billing.cancel();
    return { cancelled: true };
  }

  /** Webhook do Mercado Pago (assinaturas). Sempre responde 200. */
  @Public()
  @Post("webhooks/mercadopago")
  @HttpCode(200)
  async webhook(
    @Query() query: Record<string, string>,
    @Body() body: { type?: string; data?: { id?: string } },
  ) {
    const type = body?.type ?? query.type ?? query.topic;
    const id = body?.data?.id ?? query["data.id"] ?? query.id;
    if (id && type === "subscription_preapproval") {
      await this.billing.handlePreapprovalEvent(String(id));
    } else if (id && type === "subscription_authorized_payment") {
      await this.billing.handleAuthorizedPaymentEvent(String(id));
    }
    return { received: true };
  }
}
