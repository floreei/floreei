import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  attachmentInputSchema,
  purchaseInputSchema,
  purchaseQuerySchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../common/auth/feature.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { StockModule } from "../stock/stock.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { PurchasesService } from "./application/purchases.service";
import { PurchaseAttachmentEntity } from "./infrastructure/purchase-attachment.entity";
import { PurchaseAttachmentRepository } from "./infrastructure/purchase-attachment.repository";
import { PurchaseItemEntity } from "./infrastructure/purchase-item.entity";
import { PurchaseEntity } from "./infrastructure/purchase.entity";
import { PurchaseRepository } from "./infrastructure/purchase.repository";

class PurchaseInputDto extends createZodDto(purchaseInputSchema) {}
class PurchaseQueryDto extends createZodDto(purchaseQuerySchema) {}
class AttachmentInputDto extends createZodDto(attachmentInputSchema) {}

@RequiresFeature("INVENTORY")
@Controller("purchases")
class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Get()
  list(@Query() query: PurchaseQueryDto) {
    return this.purchases.list(query);
  }

  @Delete("attachments/:attachmentId")
  @HttpCode(204)
  removeAttachment(
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.purchases.removeAttachment(attachmentId);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.purchases.findOne(id);
  }

  @Post()
  create(@Body() dto: PurchaseInputDto) {
    return this.purchases.create(dto);
  }

  @Post(":id/receive")
  receive(@Param("id", ParseUUIDPipe) id: string) {
    return this.purchases.receive(id);
  }

  @Post(":id/unreceive")
  unreceive(@Param("id", ParseUUIDPipe) id: string) {
    return this.purchases.unreceive(id);
  }

  @Get(":id/attachments")
  listAttachments(@Param("id", ParseUUIDPipe) id: string) {
    return this.purchases.listAttachments(id);
  }

  @Post(":id/attachments")
  addAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AttachmentInputDto,
  ) {
    return this.purchases.addAttachment(id, dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: PurchaseInputDto) {
    return this.purchases.update(id, dto);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.purchases.remove(id);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseEntity,
      PurchaseItemEntity,
      PurchaseAttachmentEntity,
    ]),
    SuppliersModule,
    StockModule,
  ],
  controllers: [PurchasesController],
  providers: [
    PurchasesService,
    PurchaseRepository,
    PurchaseAttachmentRepository,
  ],
  exports: [PurchaseRepository],
})
export class PurchasesModule {}
