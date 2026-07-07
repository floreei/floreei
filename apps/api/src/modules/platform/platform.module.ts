import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionEntity } from "../billing/infrastructure/subscription.entity";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { UserEntity } from "../users/infrastructure/user.entity";
import { PlatformOwnerGuard } from "./auth/platform-admin.decorator";
import { PlatformAdminGuard } from "./auth/platform-admin.guard";
import { PlatformAdminsService } from "./application/platform-admins.service";
import { PlatformCompaniesService } from "./application/platform-companies.service";
import { PlatformAdminEntity } from "./infrastructure/platform-admin.entity";
import { PlatformController } from "./presentation/platform.controller";

/** Console do operador do SaaS: rotas `/admin/*` para gerir os tenants. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformAdminEntity,
      CompanyEntity,
      UserEntity,
      SubscriptionEntity,
    ]),
  ],
  controllers: [PlatformController],
  providers: [
    PlatformAdminGuard,
    PlatformOwnerGuard,
    PlatformCompaniesService,
    PlatformAdminsService,
  ],
})
export class PlatformModule {}
