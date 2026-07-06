import { Injectable } from "@nestjs/common";
import type {
  StockAdjustInput,
  StockMovement,
  StockMovementInput,
  StockOverview,
} from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { StockMovementEntity } from "../infrastructure/stock-movement.entity";
import { StockMovementRepository } from "../infrastructure/stock-movement.repository";

/** Arredonda quantidade para 3 casas (unidade-base pode ser fracionada). */
function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000;
}

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

/** Item de compra: quantidade em **pacotes** + preço por pacote. */
interface PurchaseAutoItem {
  productId: string | null;
  /** Quantidade na unidade de compra (pacotes). */
  quantity: number;
  /** Preço por pacote (para custo por unidade-base = preço ÷ packSize). */
  unitPrice: number;
}

@Injectable()
export class StockService {
  constructor(
    private readonly movements: StockMovementRepository,
    private readonly products: ProductRepository,
  ) {}

  /**
   * Define o saldo do produto para a quantidade informada (contagem manual). Lê o
   * saldo atual no servidor e registra só a diferença: sobra ⇒ `AJUSTE` (+);
   * falta ⇒ `SAIDA` de correção (source MANUAL) — neutra no DRE (perdas usam
   * `PERDA`). Retorna `null` quando não há diferença.
   */
  async adjustBalance(input: StockAdjustInput): Promise<StockMovement | null> {
    await this.products.findByIdOrFail(input.productId);
    const current =
      (await this.movements.onHandByProduct()).get(input.productId) ?? 0;
    const delta = roundQty(input.balance - current);
    if (delta === 0) return null;
    const movement = this.movements.create({
      productId: input.productId,
      type: delta > 0 ? "AJUSTE" : "SAIDA",
      source: "MANUAL",
      quantity: Math.abs(delta),
      notes: input.notes ?? "Ajuste manual de saldo",
      date: today(),
    });
    return toMovement(await this.movements.save(movement));
  }

  /**
   * Saídas de estoque pela **produção** de buquês (baixa a ficha técnica). Cada
   * insumo sai como `SAIDA` manual com a mesma observação (ex.: "Produção de 10×…").
   */
  async registerProduction(items: AutoItem[], notes: string): Promise<void> {
    for (const item of items) {
      if (!item.productId || item.quantity <= 0) continue;
      await this.movements.save(
        this.movements.create({
          productId: item.productId,
          type: "SAIDA",
          source: "MANUAL",
          quantity: item.quantity,
          notes,
          date: today(),
        }),
      );
    }
  }

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

  /**
   * Entradas geradas por uma compra recebida. Converte a quantidade de pacotes
   * para unidade-base (`quantidade × packSize`) e atualiza o custo por
   * unidade-base do insumo (`preço do pacote ÷ packSize` — última compra).
   */
  async registerFromPurchase(
    purchaseId: string,
    date: string,
    items: PurchaseAutoItem[],
  ): Promise<void> {
    for (const item of items) {
      if (!item.productId) continue;
      const product = await this.products.findByIdOrFail(item.productId);
      const packSize = product.packSize > 0 ? product.packSize : 1;

      await this.movements.save(
        this.movements.create({
          productId: item.productId,
          type: "ENTRADA",
          source: "PURCHASE",
          sourceId: purchaseId,
          quantity: roundQty(item.quantity * packSize),
          date,
        }),
      );

      // Última compra → custo por unidade-base.
      const newCost = roundMoney(item.unitPrice / packSize);
      if (product.currentUnitCost !== newCost) {
        product.currentUnitCost = newCost;
        await this.products.save(product);
      }
    }
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

  /** Perdas de estoque do período valorizadas a custo (para a DRE). */
  async lossesValue(from: string, to: string): Promise<number> {
    return roundMoney(await this.movements.sumLossesAtCost(from, to));
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

  /**
   * Zera as movimentações geradas por uma venda/evento (para reprocessar ao editar
   * os itens). Delete+recreate evita estornos duplicados em edições repetidas.
   */
  async clearForEvent(eventId: string): Promise<void> {
    await this.movements.deleteBySource(eventId, "EVENT");
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
        unitCost: product.currentUnitCost,
        value: roundMoney(qty * product.currentUnitCost),
        minStock: product.minStock,
        low: product.minStock > 0 && qty <= product.minStock,
      };
    });

    const expiring = await this.movements.listExpiring(today(), addDays(14));

    return {
      levels,
      lowCount: levels.filter((l) => l.low).length,
      totalValue: roundMoney(levels.reduce((acc, l) => acc + l.value, 0)),
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
