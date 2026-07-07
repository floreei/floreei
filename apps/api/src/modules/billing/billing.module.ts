import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { UserEntity } from "../users/infrastructure/user.entity";
import { BillingService } from "./application/billing.service";
import { SubscriptionEntity } from "./infrastructure/subscription.entity";
import { MercadoPagoBillingClient } from "./mercadopago-billing.client";
import { BillingController } from "./presentation/billing.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity, CompanyEntity, UserEntity]),
  ],
  controllers: [BillingController],
  providers: [BillingService, MercadoPagoBillingClient],
  exports: [BillingService],
})
export class BillingModule {}
