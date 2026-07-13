import { BadRequestException, Injectable } from "@nestjs/common";
import {
  assistantDraftSchema,
  CREATE_PURCHASE,
  EDIT_PURCHASE,
  type AiToolCall,
  type AssistantDraft,
} from "@sistema-flores/types";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { PurchasesService } from "../../purchases/application/purchases.service";
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
