import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TenantContextInterceptor } from "./tenant/tenant-context.interceptor";
import { TenantContextService } from "./tenant/tenant-context.service";
import { TenantSubscriber } from "./tenant/tenant.subscriber";

/**
 * Infraestrutura transversal: contexto de tenant (AsyncLocalStorage), subscriber
 * que carimba companyId no insert e interceptor que abre o contexto por request.
 */
@Global()
@Module({
  providers: [
    TenantContextService,
    TenantSubscriber,
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  exports: [TenantContextService],
})
export class CommonModule {}
