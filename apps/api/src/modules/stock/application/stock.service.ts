import { Injectable } from "@nestjs/common";
import type {
  StockMovement,
  StockMovementInput,
  StockOverview,
} from "@sistema-flores/types";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { StockMovementEntity } from "../infrastructure/stock-movement.entity";
import { StockMovementRepository } from "../infrastructure/stock-movement.repository";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function toMovement(m: StockMovementEntity): StockMovement {
  return {
    id: m.id,
    productId: m.productId,
    productName: m.product?.name,
    type: m.type,
    source: m.source,
    quantity: m.quantity,
    lot: m.lot,
    expiresAt: m.expiresAt,
    date: m.date,
    notes: m.notes,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
  };
}

interface AutoItem {
  productId: string | null;
  quantity: number;
}

@Injectable()
export class StockService {
  constructor(
    private readonly movements: StockMovementRepository,
    private readonly products: ProductRepository,
  ) {}

  /** Lançamento manual (perda, ajuste, entrada/saída avulsa). */
  async registerManual(input: StockMovementInput): Promise<StockMovement> {
    await this.products.findByIdOrFail(input.productId);
    const movement = this.movements.create({
      productId: input.productId,
      type: input.type,
      source: "MANUAL",
      quantity: input.quantity,
      lot: input.lot ?? null,
      expiresAt: input.expiresAt ?? null,
      notes: input.notes ?? null,
      date: today(),
    });
    return toMovement(await this.movements.save(movement));
  }

  /** Entradas geradas automaticamente por uma compra recebida. */
  async registerFromPurchase(
    purchaseId: string,
    date: string,
    items: AutoItem[],
  ): Promise<void> {
    const toCreate = items
      .filter((i) => i.productId)
      .map((i) =>
        this.movements.create({
          productId: i.productId as string,
          type: "ENTRADA",
          source: "PURCHASE",
          sourceId: purchaseId,
          quantity: i.quantity,
          date,
        }),
      );
    for (const m of toCreate) await this.movements.save(m);
  }

  /** Saídas geradas pela conversão de um orçamento em evento. */
  async registerFromEvent(
    eventId: string,
    date: string,
    items: AutoItem[],
  ): Promise<void> {
    const toCreate = items
      .filter((i) => i.productId)
      .map((i) =>
        this.movements.create({
          productId: i.productId as string,
          type: "SAIDA",
          source: "EVENT",
          sourceId: eventId,
          quantity: i.quantity,
          date,
        }),
      );
    for (const m of toCreate) await this.movements.save(m);
  }

  list(productId?: string): Promise<StockMovement[]> {
    return this.movements.list(productId).then((rows) => rows.map(toMovement));
  }

  /** Estorna as movimentações de um evento (ex.: ao cancelar), devolvendo saldo. */
  async reverseEvent(eventId: string): Promise<void> {
    const moves = (await this.movements.listBySource(eventId)).filter(
      (m) => m.source === "EVENT" && !m.notes,
    );
    for (const move of moves) {
      const reversal = this.movements.create({
        productId: move.productId,
        type: move.type === "SAIDA" ? "ENTRADA" : "SAIDA",
        source: "EVENT",
        sourceId: eventId,
        quantity: move.quantity,
        date: today(),
        notes: "Estorno de cancelamento",
      });
      await this.movements.save(reversal);
    }
  }

  /**
   * Zera as movimentações geradas por uma compra (para reprocessar ao editar ou
   * desfazer o recebimento). Delete+recreate evita estornos duplicados em
   * edições repetidas — os movimentos são a fonte de verdade do saldo.
   */
  async clearForPurchase(purchaseId: string): Promise<void> {
    await this.movements.deleteBySource(purchaseId, "PURCHASE");
  }

  /** Visão geral: saldo por produto, baixos e lotes a vencer. */
  async overview(): Promise<StockOverview> {
    const [products, onHand] = await Promise.all([
      this.products.findAll({ order: { name: "ASC" }, relations: ["category"] }),
      this.movements.onHandByProduct(),
    ]);

    const levels = products.map((product) => {
      const qty = onHand.get(product.id) ?? 0;
      return {
        productId: product.id,
        productName: product.name,
        categoryName: product.category?.name ?? null,
        unit: product.unit,
        onHand: qty,
        minStock: product.minStock,
        low: product.minStock > 0 && qty <= product.minStock,
      };
    });

    const expiring = await this.movements.listExpiring(today(), addDays(14));

    return {
      levels,
      lowCount: levels.filter((l) => l.low).length,
      expiringSoon: expiring.map((m) => ({
        productId: m.productId,
        productName: m.product?.name ?? "",
        lot: m.lot,
        expiresAt: m.expiresAt as string,
        quantity: m.quantity,
      })),
    };
  }
}
