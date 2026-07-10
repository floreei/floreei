import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NcmSyncService } from "./application/ncm-sync.service";
import { NcmService } from "./application/ncm.service";
import { NcmSuggestionEntity } from "./infrastructure/ncm-suggestion.entity";
import { NcmEntity } from "./infrastructure/ncm.entity";
import { NcmRepository } from "./infrastructure/ncm.repository";
import { NcmSyncTokenGuard } from "./presentation/ncm-sync-token.guard";
import { NcmController } from "./presentation/ncm.controller";

@Module({
  imports: [TypeOrmModule.forFeature([NcmEntity, NcmSuggestionEntity])],
  controllers: [NcmController],
  providers: [NcmService, NcmSyncService, NcmRepository, NcmSyncTokenGuard],
})
export class NcmModule {}
