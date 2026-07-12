import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { dunningSettingsSchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../../common/auth/feature.guard";
import { Public } from "../../../common/auth/public.decorator";
import { Roles } from "../../../common/auth/roles.decorator";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { DunningSettingsService } from "../application/dunning-settings.service";
import { DunningService } from "../application/dunning.service";
import { DunningRunTokenGuard } from "./dunning-run-token.guard";

class DunningSettingsDto extends createZodDto(dunningSettingsSchema) {}

@Controller("dunning")
export class DunningController {
  constructor(
    private readonly settings: DunningSettingsService,
    private readonly dunning: DunningService,
    private readonly tenant: TenantContextService,
  ) {}

  @Get("settings")
  @RequiresFeature("FINANCE")
  getSettings() {
    return this.settings.get();
  }

  @Patch("settings")
  @RequiresFeature("FINANCE")
  @Roles("ADMIN")
  updateSettings(@Body() dto: DunningSettingsDto) {
    return this.settings.update(dto);
  }

  @Get("log")
  @RequiresFeature("FINANCE")
  log() {
    return this.dunning.history(this.tenant.getCompanyIdOrThrow());
  }

  /** Disparo diário da régua (Cloud Scheduler). Rota pública com token. */
  @Post("run")
  @Public()
  @UseGuards(DunningRunTokenGuard)
  @HttpCode(200)
  run() {
    return this.dunning.runAll();
  }
}
