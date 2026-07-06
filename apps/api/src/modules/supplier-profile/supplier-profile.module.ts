import {
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import type {
  ProfileOrderItem,
  Supplier,
  SupplierProfile,
} from "@sistema-flores/types";
import { roundMoney } from "../../common/money/money";
import {
  aggregateTopItems,
  bestMonth,
  monthlySeries,
} from "../../common/profile/profile-aggregations";
import { PurchaseRepository } from "../purchases/infrastructure/purchase.repository";
import { PurchasesModule } from "../purchases/purchases.module";
import { SupplierEntity } from "../suppliers/infrastructure/supplier.entity";
import { SupplierRepository } from "../suppliers/infrastructure/supplier.repository";
import { SuppliersModule } from "../suppliers/suppliers.module";

function toSupplier(s: SupplierEntity): Supplier {
  return {
    id: s.id,
    companyId: s.companyId,
    name: s.name,
    city: s.city,
    contact: s.contact,
    whatsapp: s.whatsapp,
    paymentTerms: s.paymentTerms,
    notes: s.notes,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

@Injectable()
export class SupplierProfileService {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly purchases: PurchaseRepository,
  ) {}

  async profile(id: string): Promise<SupplierProfile> {
    const supplier = await this.suppliers.findByIdOrFail(id);

    const purchases = await this.purchases
      .qb("purchase")
      .leftJoinAndSelect("purchase.items", "pitem")
      .andWhere("purchase.supplier_id = :id", { id })
      .orderBy("purchase.date", "DESC")
      .getMany();

    const active = purchases.filter((p) => p.status !== "CANCELED");
    const totalPurchased = roundMoney(
      active.reduce((acc, p) => acc + p.total, 0),
    );
    const totalPaid = roundMoney(
      active.reduce((acc, p) => acc + p.paidAmount, 0),
    );

    const itemsOf = (p: (typeof purchases)[number]): ProfileOrderItem[] =>
      (p.items ?? []).map((it) => ({
        name: it.description,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      }));

    const monthly = monthlySeries(
      active.map((p) => ({ date: p.date, value: p.total })),
    );

    return {
      supplier: toSupplier(supplier),
      stats: {
        purchasesCount: purchases.length,
        totalPurchased,
        totalPaid,
        balanceDue: roundMoney(totalPurchased - totalPaid),
      },
      topItems: aggregateTopItems(active.flatMap(itemsOf)),
      monthly,
      bestMonth: bestMonth(monthly),
      purchases: purchases.map((p) => ({
        id: p.id,
        date: p.date,
        status: p.status,
        total: p.total,
        paidAmount: p.paidAmount,
        balanceDue: roundMoney(p.total - p.paidAmount),
        items: itemsOf(p),
      })),
    };
  }
}

@Controller("suppliers")
class SupplierProfileController {
  constructor(private readonly service: SupplierProfileService) {}

  @Get(":id/profile")
  profile(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.profile(id);
  }
}

@Module({
  imports: [SuppliersModule, PurchasesModule],
  controllers: [SupplierProfileController],
  providers: [SupplierProfileService],
})
export class SupplierProfileModule {}
