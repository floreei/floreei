import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Public } from "../../../common/auth/public.decorator";
import { NcmSyncService } from "../application/ncm-sync.service";
import { NcmService } from "../application/ncm.service";
import { NcmSyncTokenGuard } from "./ncm-sync-token.guard";
import { NcmSearchQueryDto } from "./ncm.dto";

@Controller("ncm")
export class NcmController {
  constructor(
    private readonly ncm: NcmService,
    private readonly sync: NcmSyncService,
  ) {}

  @Get("search")
  search(@Query() query: NcmSearchQueryDto) {
    return this.ncm.search(query.q);
  }

  @Get("suggestions")
  suggestions() {
    return this.ncm.listSuggestions();
  }

  @Get(":code/validate")
  validate(@Param("code") code: string) {
    return this.ncm.validate(code);
  }

  /** Chamado pelo Google Cloud Scheduler (semanal) — não por um usuário logado. */
  @Public()
  @UseGuards(NcmSyncTokenGuard)
  @Post("sync")
  @HttpCode(200)
  runSync() {
    return this.sync.sync();
  }
}
