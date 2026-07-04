import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../../../common/auth/roles.decorator";
import { QuotesService } from "../application/quotes.service";
import {
  QuoteInputDto,
  QuoteQueryDto,
  QuoteStatusUpdateDto,
} from "./quotes.dto";

@Controller("quotes")
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  list(@Query() query: QuoteQueryDto) {
    return this.quotes.list(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.quotes.findOne(id);
  }

  @Post()
  create(@Body() dto: QuoteInputDto) {
    return this.quotes.create(dto);
  }

  @Post(":id/duplicate")
  duplicate(@Param("id", ParseUUIDPipe) id: string) {
    return this.quotes.duplicate(id);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: QuoteInputDto) {
    return this.quotes.update(id, dto);
  }

  @Patch(":id/status")
  changeStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: QuoteStatusUpdateDto,
  ) {
    return this.quotes.changeStatus(id, dto.status);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.quotes.remove(id);
  }
}
