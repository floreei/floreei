import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { reviewModerationSchema, reviewQuerySchema } from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../../common/auth/feature.guard";
import { Roles } from "../../../common/auth/roles.decorator";
import { ReviewsService } from "../application/reviews.service";

class ReviewQueryDto extends createZodDto(reviewQuerySchema) {}
class ReviewModerationDto extends createZodDto(reviewModerationSchema) {}

/**
 * Moderação das avaliações da loja (backoffice). Tenant-scoped e gated pela
 * feature STORE — o lojista lista, oculta/reexibe (PATCH) e exclui (DELETE)
 * comentários indesejados.
 */
@RequiresFeature("STORE")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query() query: ReviewQueryDto) {
    return this.reviews.list(query);
  }

  @Roles("ADMIN")
  @Patch(":id")
  setStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewModerationDto,
  ) {
    return this.reviews.setStatus(id, dto.status);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.reviews.remove(id);
  }
}
