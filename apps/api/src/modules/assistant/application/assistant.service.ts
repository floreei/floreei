import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import {
  CREATE_PURCHASE,
  productInputSchema,
  purchaseInputSchema,
  supplierInputSchema,
  type AiMessage,
  type AssistantChatResponse,
  type AssistantDraft,
  type AssistantExecuteResult,
  type CreatePurchaseDraft,
  type EditPurchaseDraft,
} from "@sistema-flores/types";
import { CategoryRepository } from "../../catalog/infrastructure/category.repository";
import { ProductsService } from "../../catalog/application/products.service";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { PurchasesService } from "../../purchases/application/purchases.service";
import { SuppliersService } from "../../suppliers/suppliers.module";
import { AI_PROVIDER, type AiProvider } from "../ai/ai-provider";
import { AssistantUsageService } from "./assistant-usage.service";
import { AssistantTools } from "./assistant.tools";

const MAX_STEPS = 6;
const DEFAULT_CATEGORY = "Diversos";

const systemPrompt = () => `Você é o assistente do Floreei, um sistema para floriculturas.
Hoje é ${new Date().toISOString().slice(0, 10)}.
Ajude o lojista por conversa natural, do usuário leigo ao expert.
O que você faz:
- REGISTRAR/EDITAR compras (pedidos a fornecedor) — com as ferramentas propose_create_purchase / propose_edit_purchase.
- CONSULTAR (respostas diretas, sem aprovação): faturamento/vendas (sales_summary, find_sales), financeiro (finance_status) e estoque (stock_status).
Regras:
- Fale em português do Brasil, com frases curtas e claras. Formate valores em R$.
- Para consultas, chame a ferramenta certa e responda com os números (datas relativas como "essa semana"/"esse mês" você converte para AAAA-MM-DD).
- Para registrar/editar compra: use as buscas antes de propor; se houver mais de um fornecedor/produto parecido, PERGUNTE qual é; se não existir, ofereça cadastrar (inclua no rascunho); pergunte se JÁ FOI ENTREGUE.
- Só escreve dados via propose_* (o usuário aprova). NUNCA afirme que gravou algo sem a aprovação.
- Registrar VENDAS, cadastrar cliente/produto e ajustar estoque ainda não estão disponíveis — se pedirem, diga que por enquanto você registra COMPRAS e consulta vendas/financeiro/estoque.`;

/**
 * Orquestra a conversa com o provedor de IA (tool use) e executa o rascunho
 * aprovado. A IA nunca grava: ela busca (ferramentas de leitura) e propõe; o
 * usuário aprova e só então `execute` cria/edita via os serviços existentes.
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly tools: AssistantTools,
    private readonly usage: AssistantUsageService,
    private readonly tenant: TenantContextService,
    private readonly suppliersService: SuppliersService,
    private readonly productsService: ProductsService,
    private readonly purchasesService: PurchasesService,
    private readonly categories: CategoryRepository,
  ) {}

  async chat(messages: AiMessage[]): Promise<AssistantChatResponse> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    if (!(await this.usage.withinQuota(companyId))) {
      throw new HttpException(
        "Você atingiu a cota de uso do assistente neste mês. Fale com o suporte para liberar mais.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const working: AiMessage[] = [...messages];
    const toolDefs = this.tools.definitions();

    for (let step = 0; step < MAX_STEPS; step++) {
      let result;
      try {
        result = await this.ai.complete({
          system: systemPrompt(),
          messages: working,
          tools: toolDefs,
          userId: companyId,
        });
      } catch (err) {
        // Falha do provedor (sem créditos, rate limit, indisponível…): loga a
        // causa real e devolve uma mensagem clara — nunca um 500 cru.
        this.logger.error(
          `Provedor de IA falhou: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw new HttpException(
          "O assistente está indisponível no momento. Tente novamente em instantes.",
          HttpStatus.BAD_GATEWAY,
        );
      }
      if (result.usage) {
        // Medição por empresa — best-effort, nunca derruba a conversa.
        await this.usage.record(companyId, result.usage).catch(() => undefined);
      }

      if (result.toolCalls?.length) {
        working.push({
          role: "assistant",
          text: result.text,
          toolCalls: result.toolCalls,
        });

        const proposal = result.toolCalls.find((c) => this.tools.isProposal(c.name));
        if (proposal) {
          const draft = this.tools.parseDraft(proposal);
          return { messages: working, reply: result.text, draft };
        }

        const toolResults = [];
        for (const call of result.toolCalls) {
          toolResults.push({
            toolCallId: call.id,
            content: await this.tools.runRead(call),
          });
        }
        working.push({ role: "tool", toolResults });
        continue;
      }

      // Texto puro → pergunta/handoff ao usuário.
      working.push({ role: "assistant", text: result.text });
      return { messages: working, reply: result.text };
    }

    return {
      messages: working,
      reply: "Não consegui concluir agora. Pode reformular o pedido?",
    };
  }

  execute(draft: AssistantDraft): Promise<AssistantExecuteResult> {
    return draft.kind === CREATE_PURCHASE
      ? this.executeCreate(draft)
      : this.executeEdit(draft);
  }

  private async executeCreate(
    draft: CreatePurchaseDraft,
  ): Promise<AssistantExecuteResult> {
    // 1) Fornecedor: existente ou novo.
    let supplierId = draft.supplierId ?? null;
    let createdSupplier = false;
    if (!supplierId) {
      if (!draft.newSupplier?.name) {
        throw new BadRequestException("Informe o fornecedor da compra.");
      }
      const supplier = await this.suppliersService.create(
        supplierInputSchema.parse({
          name: draft.newSupplier.name,
          city: draft.newSupplier.city,
          whatsapp: draft.newSupplier.whatsapp,
          pixKey: draft.newSupplier.pixKey,
        }),
      );
      supplierId = supplier.id;
      createdSupplier = true;
    }

    // 2) Produtos novos (usam a categoria "Diversos").
    const createdProductIds: string[] = [];
    if (draft.newProducts.length) {
      const categoryId = await this.defaultCategoryId();
      for (const np of draft.newProducts) {
        const product = await this.productsService.create(
          productInputSchema.parse({ categoryId, name: np.name, unit: np.unit }),
        );
        createdProductIds.push(product.id);
      }
    }

    // 3) Compra.
    const items = draft.items.map((it) => ({
      productId:
        it.productId ??
        (it.newProductRef != null ? createdProductIds[it.newProductRef] : undefined) ??
        null,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
    }));
    const purchase = await this.purchasesService.create(
      purchaseInputSchema.parse({
        supplierId,
        date: draft.date,
        deliveryDate: draft.deliveryDate,
        freight: draft.freight,
        status: draft.delivered ? "RECEIVED" : "ORDERED",
        notes: draft.notes,
        items,
      }),
    );

    return {
      purchaseId: purchase.id,
      href: `/compras/${purchase.id}`,
      created: { supplier: createdSupplier, products: createdProductIds.length },
      message: draft.delivered
        ? "Compra registrada e recebida no estoque."
        : "Pedido registrado.",
    };
  }

  private async executeEdit(
    draft: EditPurchaseDraft,
  ): Promise<AssistantExecuteResult> {
    const current = await this.purchasesService.findOne(draft.purchaseId);
    const c = draft.changes;

    if (c.date || c.deliveryDate || c.notes) {
      await this.purchasesService.update(
        draft.purchaseId,
        purchaseInputSchema.parse({
          supplierId: current.supplierId,
          date: c.date ?? current.date,
          deliveryDate: c.deliveryDate ?? current.deliveryDate ?? undefined,
          deliveryTime: current.deliveryTime ?? undefined,
          freight: current.freight,
          status: current.status,
          notes: c.notes ?? current.notes ?? undefined,
          items: current.items.map((i) => ({
            productId: i.productId,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
          })),
        }),
      );
    }
    if (c.delivered === true) await this.purchasesService.receive(draft.purchaseId);
    else if (c.delivered === false)
      await this.purchasesService.unreceive(draft.purchaseId);

    return {
      purchaseId: draft.purchaseId,
      href: `/compras/${draft.purchaseId}`,
      created: { supplier: false, products: 0 },
      message: "Compra atualizada.",
    };
  }

  /** Categoria "Diversos" (find-or-create) para produtos criados pela IA. */
  private async defaultCategoryId(): Promise<string> {
    const existing = await this.categories.findByName(DEFAULT_CATEGORY);
    if (existing) return existing.id;
    const created = await this.categories.save(
      this.categories.create({ name: DEFAULT_CATEGORY }),
    );
    return created.id;
  }
}
