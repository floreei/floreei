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
import { InjectRepository, TypeOrmModule } from "@nestjs/typeorm";
import {
  supplierInputSchema,
  supplierQuerySchema,
  type Paginated,
  type PartyRanking,
  type Supplier,
  type SupplierInput,
  type SupplierQuery,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { Repository } from "typeorm";
import { RequiresFeature } from "../../common/auth/feature.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { roundMoney } from "../../common/money/money";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { PurchaseEntity } from "../purchases/infrastructure/purchase.entity";
import { SupplierEntity } from "./infrastructure/supplier.entity";
import { SupplierRepository } from "./infrastructure/supplier.repository";

class SupplierInputDto extends createZodDto(supplierInputSchema) {}
class SupplierQueryDto extends createZodDto(supplierQuerySchema) {}

interface SupplierAgg {
  total: number;
  count: number;
  lastPurchaseAt: string | null;
}

@Injectable()
export class SuppliersService {
  // Usa o PurchaseEntity cru (não o PurchaseRepository) + tenant manual para
  // evitar ciclo de módulo: PurchasesModule já importa SuppliersModule.
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly tenant: TenantContextService,
    @InjectRepository(PurchaseEntity)
    private readonly purchases: Repository<PurchaseEntity>,
  ) {}

  private purchasesQb() {
    return this.purchases
      .createQueryBuilder("purchase")
      .where("purchase.company_id = :cid", {
        cid: this.tenant.getCompanyIdOrThrow(),
      });
  }

  async list(query: SupplierQuery): Promise<Paginated<Supplier>> {
    const page = await this.suppliers.search(query);
    const aggs = await this.aggregatesFor(page.data.map((s) => s.id));
    return {
      ...page,
      data: page.data.map((s) => {
        const a = aggs.get(s.id);
        return {
          ...(s as unknown as Supplier),
          totalPurchased: a?.total ?? 0,
          purchasesCount: a?.count ?? 0,
          lastPurchaseAt: a?.lastPurchaseAt ?? null,
        };
      }),
    };
  }

  /** Total gasto, nº de compras e última compra por fornecedor (não canceladas). */
  private async aggregatesFor(ids: string[]): Promise<Map<string, SupplierAgg>> {
    const map = new Map<string, SupplierAgg>();
    if (ids.length === 0) return map;
    const rows = await this.purchasesQb()
      .select("purchase.supplier_id", "supplierId")
      .addSelect("COALESCE(SUM(purchase.total),0)", "total")
      .addSelect("COUNT(*)", "count")
      .addSelect("TO_CHAR(MAX(purchase.date), 'YYYY-MM-DD')", "lastDate")
      .andWhere("purchase.status <> 'CANCELED'")
      .andWhere("purchase.supplier_id IN (:...ids)", { ids })
      .groupBy("purchase.supplier_id")
      .getRawMany<{
        supplierId: string;
        total: string;
        count: string;
        lastDate: string | null;
      }>();
    for (const r of rows) {
      map.set(r.supplierId, {
        total: roundMoney(Number(r.total ?? 0)),
        count: Number(r.count ?? 0),
        lastPurchaseAt: r.lastDate ?? null,
      });
    }
    return map;
  }

  /** Fornecedores de quem você mais compra (por total gasto). */
  async ranking(): Promise<PartyRanking[]> {
    const rows = await this.purchasesQb()
      .innerJoin("purchase.supplier", "supplier")
      .select("supplier.id", "id")
      .addSelect("supplier.name", "name")
      .addSelect("COALESCE(SUM(purchase.total),0)", "total")
      .addSelect("COUNT(*)", "count")
      .andWhere("purchase.status <> 'CANCELED'")
      .groupBy("supplier.id")
      .addGroupBy("supplier.name")
      .orderBy("total", "DESC")
      .limit(8)
      .getRawMany<{ id: string; name: string; total: string; count: string }>();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      total: roundMoney(Number(r.total ?? 0)),
      count: Number(r.count ?? 0),
    }));
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

@RequiresFeature("INVENTORY")
@Controller("suppliers")
class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  list(@Query() query: SupplierQueryDto) {
    return this.suppliers.list(query);
  }

  /** Ranking "quem mais compra" (por total gasto) para o widget da lista. */
  @Get("ranking")
  ranking() {
    return this.suppliers.ranking();
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
  imports: [TypeOrmModule.forFeature([SupplierEntity, PurchaseEntity])],
  controllers: [SuppliersController],
  providers: [SuppliersService, SupplierRepository],
  exports: [SuppliersService, SupplierRepository],
})
export class SuppliersModule {}
