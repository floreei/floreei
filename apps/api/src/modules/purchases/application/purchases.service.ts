import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  AttachmentInput,
  Paginated,
  Purchase,
  PurchaseAttachment,
  PurchaseInput,
  PurchaseItemInput,
  PurchaseQuery,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney, sumMoney } from "../../../common/money/money";
import { StockService } from "../../stock/application/stock.service";
import { SupplierRepository } from "../../suppliers/infrastructure/supplier.repository";
import { PurchaseAttachmentEntity } from "../infrastructure/purchase-attachment.entity";
import { PurchaseAttachmentRepository } from "../infrastructure/purchase-attachment.repository";
import { PurchaseItemEntity } from "../infrastructure/purchase-item.entity";
import { PurchaseRepository } from "../infrastructure/purchase.repository";
import { toPurchase } from "./purchase.mapper";

function toAttachment(a: PurchaseAttachmentEntity): PurchaseAttachment {
  return {
    id: a.id,
    purchaseId: a.purchaseId,
    label: a.label,
    url: a.url,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  };
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly purchases: PurchaseRepository,
    private readonly suppliers: SupplierRepository,
    private readonly stock: StockService,
    private readonly attachments: PurchaseAttachmentRepository,
    @InjectRepository(PurchaseItemEntity)
    private readonly items: Repository<PurchaseItemEntity>,
  ) {}

  async list(query: PurchaseQuery): Promise<Paginated<Purchase>> {
    const page = await this.purchases.search(query);
    return { ...page, data: page.data.map(toPurchase) };
  }

  async findOne(id: string): Promise<Purchase> {
    return toPurchase(
      await this.purchases.findByIdOrFail(id, ["supplier", "items"]),
    );
  }

  async create(input: PurchaseInput): Promise<Purchase> {
    await this.suppliers.findByIdOrFail(input.supplierId);
    const totals = this.totals(input.items, input.freight);

    const purchase = this.purchases.create({
      supplierId: input.supplierId,
      date: input.date,
      deliveryDate: input.deliveryDate ?? null,
      deliveryTime: input.deliveryTime ?? null,
      status: input.status,
      freight: input.freight,
      notes: input.notes ?? null,
      items: this.buildItems(input.items),
      ...totals,
    });

    const saved = await this.purchases.save(purchase);

    if (input.status === "RECEIVED") {
      await this.stock.registerFromPurchase(
        saved.id,
        input.date,
        input.items.map((i) => ({
          productId: i.productId ?? null,
          quantity: i.quantity,
        })),
      );
    }

    return this.findOne(saved.id);
  }

  async update(id: string, input: PurchaseInput): Promise<Purchase> {
    const purchase = await this.purchases.findByIdOrFail(id);
    if (input.supplierId !== purchase.supplierId) {
      await this.suppliers.findByIdOrFail(input.supplierId);
    }
    const totals = this.totals(input.items, input.freight);
    if (purchase.paidAmount > totals.total) {
      throw new BadRequestException(
        "O total da compra não pode ficar abaixo do valor já pago.",
      );
    }

    await this.items.delete({ purchaseId: id });
    const newItems = this.buildItems(input.items).map((item) => {
      item.purchaseId = id;
      return item;
    });
    await this.items.save(newItems);

    await this.purchases.updateById(id, {
      supplierId: input.supplierId,
      date: input.date,
      deliveryDate: input.deliveryDate ?? null,
      deliveryTime: input.deliveryTime ?? null,
      status: input.status,
      freight: input.freight,
      notes: input.notes ?? null,
      ...totals,
    });

    // Reprocessa o estoque desta compra do zero (idempotente — evita estorno
    // duplicado ao editar). Só entra no estoque quando a compra está RECEBIDA.
    await this.stock.clearForPurchase(id);
    const nowReceived = (input.status ?? purchase.status) === "RECEIVED";
    if (nowReceived) {
      await this.stock.registerFromPurchase(
        id,
        input.date,
        input.items.map((i) => ({
          productId: i.productId ?? null,
          quantity: i.quantity,
        })),
      );
    }

    return this.findOne(id);
  }

  /** Marca uma compra como recebida (entregue): registra a entrada no estoque. */
  async receive(id: string): Promise<Purchase> {
    const purchase = await this.purchases.findByIdOrFail(id, ["items"]);
    if (purchase.status === "RECEIVED") {
      throw new BadRequestException("Esta compra já foi recebida.");
    }
    await this.purchases.updateById(id, { status: "RECEIVED" });
    await this.stock.registerFromPurchase(
      id,
      purchase.date,
      purchase.items.map((i) => ({
        productId: i.productId ?? null,
        quantity: i.quantity,
      })),
    );
    return this.findOne(id);
  }

  /** Desfaz a entrega (volta a pedido): estorna a entrada de estoque. */
  async unreceive(id: string): Promise<Purchase> {
    const purchase = await this.purchases.findByIdOrFail(id);
    if (purchase.status !== "RECEIVED") {
      throw new BadRequestException("Esta compra ainda não foi recebida.");
    }
    await this.stock.clearForPurchase(id);
    await this.purchases.updateById(id, { status: "ORDERED" });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const purchase = await this.purchases.findByIdOrFail(id);
    if (purchase.paidAmount > 0) {
      throw new BadRequestException(
        "Compra com pagamentos registrados não pode ser excluída.",
      );
    }
    await this.purchases.deleteById(id);
  }

  // --- Anexos (comprovante de pagamento, nota) ---------------------------------

  async listAttachments(purchaseId: string): Promise<PurchaseAttachment[]> {
    await this.purchases.findByIdOrFail(purchaseId);
    const rows = await this.attachments.listForPurchase(purchaseId);
    return rows.map(toAttachment);
  }

  async addAttachment(
    purchaseId: string,
    input: AttachmentInput,
  ): Promise<PurchaseAttachment> {
    await this.purchases.findByIdOrFail(purchaseId);
    const saved = await this.attachments.save(
      this.attachments.create({ purchaseId, label: input.label, url: input.url }),
    );
    return toAttachment(saved);
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    await this.attachments.findByIdOrFail(attachmentId);
    await this.attachments.deleteById(attachmentId);
  }

  private totals(items: PurchaseItemInput[], freight: number) {
    const itemsTotal = sumMoney(
      items.map((i) => roundMoney(i.quantity * i.unitPrice)),
    );
    return { itemsTotal, total: roundMoney(itemsTotal + freight) };
  }

  private buildItems(inputs: PurchaseItemInput[]): PurchaseItemEntity[] {
    return inputs.map((input) => {
      const item = new PurchaseItemEntity();
      Object.assign(item, {
        productId: input.productId ?? null,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        unitPrice: input.unitPrice,
        lineTotal: roundMoney(input.quantity * input.unitPrice),
      });
      return item;
    });
  }
}
