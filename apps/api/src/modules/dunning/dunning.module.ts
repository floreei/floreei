import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WhatsappService } from "../../common/whatsapp/whatsapp.service";
import { CompanyEntity } from "../companies/infrastructure/company.entity";
import { EventEntity } from "../events/infrastructure/event.entity";
import { DunningSender } from "./application/dunning-sender.service";
import { DunningSettingsService } from "./application/dunning-settings.service";
import { DunningService } from "./application/dunning.service";
import { DunningLogEntity } from "./infrastructure/dunning-log.entity";
import { DunningSettingsEntity } from "./infrastructure/dunning-settings.entity";
import { DunningSettingsRepository } from "./infrastructure/dunning-settings.repository";
import { DunningRunTokenGuard } from "./presentation/dunning-run-token.guard";
import { DunningController } from "./presentation/dunning.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DunningSettingsEntity,
      DunningLogEntity,
      EventEntity,
      CompanyEntity,
    ]),
  ],
  controllers: [DunningController],
  providers: [
    DunningService,
    DunningSettingsService,
    DunningSettingsRepository,
    DunningSender,
    WhatsappService,
    DunningRunTokenGuard,
  ],
})
export class DunningModule {}
