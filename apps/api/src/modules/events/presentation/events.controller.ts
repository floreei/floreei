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
import { attachmentInputSchema, quickSaleSchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Roles } from "../../../common/auth/roles.decorator";
import { EventsService } from "../application/events.service";
import {
  ConvertQuoteDto,
  EventInputDto,
  EventQueryDto,
  EventUpdateDto,
} from "./events.dto";

class AttachmentInputDto extends createZodDto(attachmentInputSchema) {}
class QuickSaleDto extends createZodDto(quickSaleSchema) {}

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query() query: EventQueryDto) {
    return this.events.list(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.events.findOne(id);
  }

  @Post()
  create(@Body() dto: EventInputDto) {
    return this.events.create(dto);
  }

  @Post("quick")
  quickSale(@Body() dto: QuickSaleDto) {
    return this.events.quickSale(dto);
  }

  @Post("from-quote/:quoteId")
  convert(
    @Param("quoteId", ParseUUIDPipe) quoteId: string,
    @Body() dto: ConvertQuoteDto,
  ) {
    return this.events.convertFromQuote(quoteId, dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: EventUpdateDto) {
    return this.events.update(id, dto);
  }

  @Post(":id/cancel")
  @HttpCode(200)
  cancel(@Param("id", ParseUUIDPipe) id: string) {
    return this.events.cancel(id);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.events.remove(id);
  }

  @Get(":id/attachments")
  listAttachments(@Param("id", ParseUUIDPipe) id: string) {
    return this.events.listAttachments(id);
  }

  @Post(":id/attachments")
  addAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AttachmentInputDto,
  ) {
    return this.events.addAttachment(id, dto);
  }

  @Delete("attachments/:attachmentId")
  @HttpCode(204)
  removeAttachment(
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.events.removeAttachment(attachmentId);
  }
}
