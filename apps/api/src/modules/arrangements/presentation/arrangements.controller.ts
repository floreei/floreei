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
import { RequiresFeature } from "../../../common/auth/feature.guard";
import { Roles } from "../../../common/auth/roles.decorator";
import { ArrangementsService } from "../application/arrangements.service";
import { ArrangementInputDto, ArrangementQueryDto } from "./arrangement.dto";

@RequiresFeature("ARRANGEMENTS")
@Controller("arrangements")
export class ArrangementsController {
  constructor(private readonly arrangements: ArrangementsService) {}

  @Get()
  list(@Query() query: ArrangementQueryDto) {
    return this.arrangements.list(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.arrangements.findOne(id);
  }

  @Post()
  create(@Body() dto: ArrangementInputDto) {
    return this.arrangements.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ArrangementInputDto,
  ) {
    return this.arrangements.update(id, dto);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.arrangements.remove(id);
  }
}
