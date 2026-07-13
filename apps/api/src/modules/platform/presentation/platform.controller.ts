import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  companiesQuerySchema,
  extendTrialSchema,
  setAssistantQuotaSchema,
  setCompanyUserActiveSchema,
  invitePlatformAdminSchema,
  setTrialEndSchema,
  type PlanTier,
  planTiers,
  type PlatformSession,
  updateEntitlementsSchema,
  updatePlanDefinitionSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Public } from "../../../common/auth/public.decorator";
import {
  CurrentAdmin,
  PlatformOwnerGuard,
} from "../auth/platform-admin.decorator";
import {
  PlatformAdminGuard,
  type PlatformAdminContext,
} from "../auth/platform-admin.guard";
import { BillingService } from "../../billing/application/billing.service";
import { PlanDefinitionsService } from "../../plans/plan-definitions.service";
import { PlatformAdminsService } from "../application/platform-admins.service";
import { PlatformCompaniesService } from "../application/platform-companies.service";
import { PlatformNotificationsService } from "../notifications/platform-notifications.service";

class CompaniesQueryDto extends createZodDto(companiesQuerySchema) {}
class ExtendTrialDto extends createZodDto(extendTrialSchema) {}
class SetTrialEndDto extends createZodDto(setTrialEndSchema) {}
class InviteAdminDto extends createZodDto(invitePlatformAdminSchema) {}
class UpdateEntitlementsDto extends createZodDto(updateEntitlementsSchema) {}
class SetCompanyUserActiveDto extends createZodDto(setCompanyUserActiveSchema) {}
class SetAssistantQuotaDto extends createZodDto(setAssistantQuotaSchema) {}
class UpdatePlanDto extends createZodDto(updatePlanDefinitionSchema) {}

/**
 * Console do gestor da plataforma. `@Public()` pula o guard de tenant do cliente;
 * o acesso é garantido pelo PlatformAdminGuard (equipe de gestores).
 */
@Public()
@UseGuards(PlatformAdminGuard)
@Controller("admin")
export class PlatformController {
  constructor(
    private readonly companies: PlatformCompaniesService,
    private readonly admins: PlatformAdminsService,
    private readonly planDefs: PlanDefinitionsService,
    private readonly billing: BillingService,
    private readonly notifications: PlatformNotificationsService,
  ) {}

  @Get("me")
  me(@CurrentAdmin() admin: PlatformAdminContext): PlatformSession {
    return { email: admin.email, name: admin.name, role: admin.role };
  }

  @Get("notifications")
  listNotifications() {
    return this.notifications.list();
  }

  @Post("notifications/read")
  async markNotificationsRead() {
    await this.notifications.markAllRead();
    return { ok: true };
  }

  @Get("overview")
  overview() {
    return this.companies.overview();
  }

  @Get("companies")
  listCompanies(@Query() query: CompaniesQueryDto) {
    return this.companies.list(query);
  }

  @Get("companies/:id")
  companyDetail(@Param("id") id: string) {
    return this.companies.detail(id);
  }

  /** Histórico de IA da empresa (ações executadas + conversas). */
  @Get("companies/:id/assistant-log")
  assistantLog(@Param("id") id: string) {
    return this.companies.assistantLog(id);
  }

  @Post("companies/:id/extend-trial")
  extendTrial(@Param("id") id: string, @Body() dto: ExtendTrialDto) {
    return this.companies.extendTrial(id, dto.days);
  }

  @Post("companies/:id/set-trial-end")
  setTrialEnd(@Param("id") id: string, @Body() dto: SetTrialEndDto) {
    return this.companies.setTrialEnd(id, dto.date);
  }

  @Post("companies/:id/activate")
  activate(@Param("id") id: string) {
    return this.companies.activate(id);
  }

  @Post("companies/:id/suspend")
  suspend(@Param("id") id: string) {
    return this.companies.suspend(id);
  }

  @Post("companies/:id/reactivate")
  reactivate(@Param("id") id: string) {
    return this.companies.reactivate(id);
  }

  @Put("companies/:id/entitlements")
  updateEntitlements(
    @Param("id") id: string,
    @Body() dto: UpdateEntitlementsDto,
  ) {
    return this.companies.updateEntitlements(id, dto);
  }

  /** Define/limpa o override de cota de IA da empresa (o "plus"). */
  @Post("companies/:id/assistant-quota")
  setAssistantQuota(
    @Param("id") id: string,
    @Body() dto: SetAssistantQuotaDto,
  ) {
    return this.companies.setAssistantQuota(id, dto.quota);
  }

  /** Ativa/desativa o acesso de um membro da equipe da empresa. */
  @Post("companies/:id/users/:userId/set-active")
  setCompanyUserActive(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() dto: SetCompanyUserActiveDto,
  ) {
    return this.companies.setUserActive(id, userId, dto.active);
  }

  /** Exclui um membro da equipe (banco + Firebase). Irreversível, só OWNER. */
  @UseGuards(PlatformOwnerGuard)
  @Delete("companies/:id/users/:userId")
  deleteCompanyUser(
    @Param("id") id: string,
    @Param("userId") userId: string,
  ) {
    return this.companies.deleteUser(id, userId);
  }

  /** Exclui a empresa por completo (Firebase + banco). Irreversível, só OWNER. */
  @UseGuards(PlatformOwnerGuard)
  @Delete("companies/:id")
  deleteCompany(@Param("id") id: string) {
    return this.companies.deleteCompany(id);
  }

  /** Definições vigentes dos planos (preço, preço/usuário, features). */
  @Get("plans")
  async listPlans() {
    const defs = await this.planDefs.list();
    return defs.map((d) => this.planDefs.toOffer(d));
  }

  /** Edita um plano e reaplica o preço às assinaturas em vigor (OWNER). */
  @UseGuards(PlatformOwnerGuard)
  @Put("plans/:tier")
  async updatePlan(@Param("tier") tier: string, @Body() dto: UpdatePlanDto) {
    if (!(planTiers as readonly string[]).includes(tier)) {
      throw new NotFoundException("Plano não encontrado.");
    }
    const saved = await this.planDefs.update(tier as PlanTier, dto);
    if (dto.basePrice !== undefined || dto.userPrice !== undefined) {
      await this.billing.resyncTierAmounts(saved.tier);
    }
    return this.planDefs.toOffer(saved);
  }

  @Get("admins")
  listAdmins() {
    return this.admins.list();
  }

  @UseGuards(PlatformOwnerGuard)
  @Post("admins")
  invite(@Body() dto: InviteAdminDto) {
    return this.admins.invite(dto);
  }

  @UseGuards(PlatformOwnerGuard)
  @Delete("admins/:id")
  remove(@Param("id") id: string, @CurrentAdmin() admin: PlatformAdminContext) {
    return this.admins.remove(id, admin.id);
  }
}
