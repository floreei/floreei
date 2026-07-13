import { BadRequestException, Injectable } from "@nestjs/common";
import {
  assistantDraftSchema,
  CREATE_PURCHASE,
  EDIT_PURCHASE,
  type AiToolCall,
  type AssistantDraft,
} from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { EventsService } from "../../events/application/events.service";
import { FinanceService } from "../../finance/application/finance.service";
import { PurchasesService } from "../../purchases/application/purchases.service";
import { ReportsService } from "../../reports/reports.service";
import { StockService } from "../../stock/application/stock.service";
import { SupplierRepository } from "../../suppliers/infrastructure/supplier.repository";
import type { AiToolDef } from "../ai/ai-provider";

/** Nomes das ferramentas de PROPOSTA (encerram o loop e viram rascunho). */
export const PROPOSAL_TOOLS = ["propose_create_purchase", "propose_edit_purchase"];

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Ferramentas do assistente: leitura (executam na hora, escopadas por tenant) e
 * proposta (validam o rascunho que o usuário vai aprovar). Reusa os
 * repositórios/serviços existentes — nada de acesso cru ao banco.
 */
@Injectable()
export class AssistantTools {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly products: ProductRepository,
    private readonly purchases: PurchasesService,
    private readonly events: EventsService,
    private readonly finance: FinanceService,
    private readonly reports: ReportsService,
    private readonly stock: StockService,
  ) {}

  /** Definições (JSON Schema) expostas ao modelo. */
  definitions(): AiToolDef[] {
    const supplierRef = {
      supplierId: { type: ["string", "null"], description: "id de fornecedor existente" },
      newSupplier: {
        type: ["object", "null"],
        description: "dados de um fornecedor novo (quando não existe)",
        properties: {
          name: { type: "string" },
          city: { type: "string" },
          whatsapp: { type: "string" },
          pixKey: { type: "string" },
        },
      },
      supplierName: { type: "string" },
    };
    return [
      {
        name: "search_suppliers",
        description: "Busca fornecedores por nome. Use antes de propor a compra.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
      {
        name: "search_products",
        description: "Busca produtos no catálogo por nome.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
      {
        name: "find_purchases",
        description:
          "Lista compras recentes (para consultar ou editar). Filtros opcionais.",
        parameters: {
          type: "object",
          properties: {
            supplierId: { type: "string" },
            unpaidOnly: { type: "boolean" },
            from: { type: "string", description: "AAAA-MM-DD" },
            to: { type: "string", description: "AAAA-MM-DD" },
          },
        },
      },
      {
        name: "get_purchase",
        description: "Detalhes de uma compra por id.",
        parameters: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "sales_summary",
        description:
          "Faturamento do período (total vendido, nº de vendas, top produtos). Use para 'quanto vendi/faturei'.",
        parameters: {
          type: "object",
          properties: {
            from: { type: "string", description: "AAAA-MM-DD" },
            to: { type: "string", description: "AAAA-MM-DD" },
          },
        },
      },
      {
        name: "find_sales",
        description: "Lista vendas recentes (filtros opcionais de data/canal/cliente).",
        parameters: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" },
            channel: { type: "string", enum: ["RETAIL", "WHOLESALE"] },
            customerId: { type: "string" },
          },
        },
      },
      {
        name: "finance_status",
        description:
          "Situação financeira: a receber, a pagar, recebido e pago no mês. Use para 'quanto tenho a receber/pagar'.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "stock_status",
        description:
          "Estoque atual. `query` filtra por nome; `lowOnly` mostra só o que está baixo. Use para 'quanto tenho de rosa' ou 'o que está acabando'.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            lowOnly: { type: "boolean" },
          },
        },
      },
      {
        name: "propose_create_purchase",
        description:
          "Propõe registrar uma compra/pedido para o usuário aprovar. Inclua fornecedor (existente ou novo), itens (produto existente, novo, ou descrição) e se já foi entregue.",
        parameters: {
          type: "object",
          properties: {
            ...supplierRef,
            newProducts: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, unit: { type: "string" } },
                required: ["name"],
              },
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: ["string", "null"] },
                  newProductRef: {
                    type: ["number", "null"],
                    description: "índice em newProducts",
                  },
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" },
                  unitPrice: { type: "number" },
                },
                required: ["description", "quantity"],
              },
            },
            delivered: { type: "boolean" },
            date: { type: "string", description: "AAAA-MM-DD" },
            deliveryDate: { type: "string" },
            freight: { type: "number" },
            notes: { type: "string" },
          },
          required: ["supplierName", "items"],
        },
      },
      {
        name: "propose_edit_purchase",
        description:
          "Propõe editar uma compra existente (marcar entregue, mudar data, etc.) para o usuário aprovar.",
        parameters: {
          type: "object",
          properties: {
            purchaseId: { type: "string" },
            purchaseLabel: { type: "string" },
            changes: {
              type: "object",
              properties: {
                delivered: { type: "boolean" },
                date: { type: "string" },
                deliveryDate: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
          required: ["purchaseId", "purchaseLabel", "changes"],
        },
      },
    ];
  }

  isProposal(name: string): boolean {
    return PROPOSAL_TOOLS.includes(name);
  }

  /** Executa uma ferramenta de leitura e devolve o resultado como JSON string. */
  async runRead(call: AiToolCall): Promise<string> {
    const input = (call.input ?? {}) as Record<string, unknown>;
    switch (call.name) {
      case "search_suppliers": {
        const rows = await this.suppliers
          .qb("s")
          .andWhere("s.name ILIKE :q", { q: `%${String(input.query ?? "")}%` })
          .orderBy("s.name", "ASC")
          .limit(8)
          .getMany();
        return JSON.stringify({
          suppliers: rows.map((s) => ({
            id: s.id,
            name: s.name,
            city: s.city,
            pixKey: s.pixKey,
          })),
        });
      }
      case "search_products": {
        const rows = await this.products
          .qb("p")
          .andWhere("p.name ILIKE :q", { q: `%${String(input.query ?? "")}%` })
          .orderBy("p.name", "ASC")
          .limit(8)
          .getMany();
        return JSON.stringify({
          products: rows.map((p) => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            currentUnitCost: p.currentUnitCost,
          })),
        });
      }
      case "find_purchases": {
        const page = await this.purchases.list({
          supplierId: input.supplierId as string | undefined,
          unpaidOnly: input.unpaidOnly as boolean | undefined,
          from: input.from as string | undefined,
          to: input.to as string | undefined,
          page: 1,
          pageSize: 8,
        });
        return JSON.stringify({
          purchases: page.data.map((p) => ({
            id: p.id,
            supplierName: p.supplier?.name ?? null,
            date: p.date,
            status: p.status,
            total: p.total,
            balanceDue: p.balanceDue,
          })),
        });
      }
      case "get_purchase": {
        const p = await this.purchases.findOne(String(input.id));
        return JSON.stringify({
          id: p.id,
          supplierName: p.supplier?.name ?? null,
          date: p.date,
          status: p.status,
          total: p.total,
          items: p.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
          })),
        });
      }
      case "sales_summary": {
        const report = await this.reports.generate(
          input.from as string | undefined,
          input.to as string | undefined,
        );
        return JSON.stringify({
          from: report.from,
          to: report.to,
          revenue: report.summary.revenue,
          salesCount: report.summary.eventsCount,
          received: report.summary.received,
          grossProfit: report.summary.grossProfit,
          topProducts: report.topProducts.slice(0, 5).map((p) => ({
            name: p.name,
            revenue: p.revenue,
          })),
        });
      }
      case "find_sales": {
        const page = await this.events.list({
          from: input.from as string | undefined,
          to: input.to as string | undefined,
          channel: input.channel as "RETAIL" | "WHOLESALE" | undefined,
          customerId: input.customerId as string | undefined,
          page: 1,
          pageSize: 8,
        });
        return JSON.stringify({
          sales: page.data.map((e) => ({
            id: e.id,
            customerName: e.customer?.name ?? null,
            date: e.date,
            channel: e.channel,
            total: e.soldValue,
            received: e.receivedValue,
            balanceDue: roundMoney(e.soldValue - e.receivedValue),
          })),
        });
      }
      case "finance_status": {
        const s = await this.finance.summary();
        return JSON.stringify({
          totalReceivable: s.totalReceivable,
          totalPayable: s.totalPayable,
          receivedThisMonth: s.receivedThisMonth,
          paidThisMonth: s.paidThisMonth,
          netThisMonth: s.netThisMonth,
        });
      }
      case "stock_status": {
        const overview = await this.stock.overview();
        const q = String(input.query ?? "").toLowerCase();
        const lowOnly = input.lowOnly === true;
        const levels = overview.levels
          .filter((l) => (q ? l.productName.toLowerCase().includes(q) : true))
          .filter((l) => (lowOnly ? l.low : true))
          .slice(0, 12)
          .map((l) => ({
            name: l.productName,
            unit: l.unit,
            onHand: l.onHand,
            minStock: l.minStock,
            low: l.low,
          }));
        return JSON.stringify({ levels });
      }
      default:
        return JSON.stringify({ error: `Ferramenta desconhecida: ${call.name}` });
    }
  }

  /** Valida o rascunho proposto pelo modelo, com defaults úteis. */
  parseDraft(call: AiToolCall): AssistantDraft {
    const kind = call.name === "propose_edit_purchase" ? EDIT_PURCHASE : CREATE_PURCHASE;
    const raw: Record<string, unknown> = {
      ...(call.input as Record<string, unknown>),
      kind,
    };
    if (kind === CREATE_PURCHASE && !raw.date) raw.date = todayISO();
    const result = assistantDraftSchema.safeParse(raw);
    if (!result.success) {
      throw new BadRequestException(
        "Não consegui montar um resumo válido. Pode reformular o pedido?",
      );
    }
    return result.data;
  }
}
