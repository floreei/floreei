import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  supplierInputSchema,
  supplierQuerySchema,
  type SupplierInput,
  type SupplierQuery,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Roles } from "../../common/auth/roles.decorator";
import { SupplierEntity } from "./infrastructure/supplier.entity";
import { SupplierRepository } from "./infrastructure/supplier.repository";

class SupplierInputDto extends createZodDto(supplierInputSchema) {}
class SupplierQueryDto extends createZodDto(supplierQuerySchema) {}

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliers: SupplierRepository) {}

  list(query: SupplierQuery) {
    return this.suppliers.search(query);
  }

  findOne(id: string) {
    return this.suppliers.findByIdOrFail(id);
  }

  create(input: SupplierInput) {
    return this.suppliers.save(this.suppliers.create(input));
  }

  async update(id: string, input: SupplierInput) {
    const supplier = await this.suppliers.findByIdOrFail(id);
    Object.assign(supplier, input);
    return this.suppliers.save(supplier);
  }

  remove(id: string) {
    return this.suppliers.deleteById(id);
  }
}

@Controller("suppliers")
class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  list(@Query() query: SupplierQueryDto) {
    return this.suppliers.list(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.suppliers.findOne(id);
  }

  @Post()
  create(@Body() dto: SupplierInputDto) {
    return this.suppliers.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: SupplierInputDto) {
    return this.suppliers.update(id, dto);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.suppliers.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([SupplierEntity])],
  controllers: [SuppliersController],
  providers: [SuppliersService, SupplierRepository],
  exports: [SupplierRepository],
})
export class SuppliersModule {}
