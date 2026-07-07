import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  companiesQuerySchema,
  extendTrialSchema,
  invitePlatformAdminSchema,
  type PlatformSession,
  updateEntitlementsSchema,
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
import { PlatformAdminsService } from "../application/platform-admins.service";
import { PlatformCompaniesService } from "../application/platform-companies.service";

class CompaniesQueryDto extends createZodDto(companiesQuerySchema) {}
class ExtendTrialDto extends createZodDto(extendTrialSchema) {}
class InviteAdminDto extends createZodDto(invitePlatformAdminSchema) {}
class UpdateEntitlementsDto extends createZodDto(updateEntitlementsSchema) {}

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
  ) {}

  @Get("me")
  me(@CurrentAdmin() admin: PlatformAdminContext): PlatformSession {
    return { email: admin.email, name: admin.name, role: admin.role };
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

  @Post("companies/:id/extend-trial")
  extendTrial(@Param("id") id: string, @Body() dto: ExtendTrialDto) {
    return this.companies.extendTrial(id, dto.days);
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
