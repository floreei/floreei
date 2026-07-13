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
  CREATE_SALE,
  customerInputSchema,
  paymentInputSchema,
  productInputSchema,
  purchaseInputSchema,
  quickSaleSchema,
  supplierInputSchema,
  type AiMessage,
  type AssistantChatResponse,
  type AssistantDraft,
  type AssistantExecuteResult,
  type CreatePurchaseDraft,
  type CreateSaleDraft,
  type EditPurchaseDraft,
} from "@sistema-flores/types";
import { CategoryRepository } from "../../catalog/infrastructure/category.repository";
import { ProductsService } from "../../catalog/application/products.service";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CustomersService } from "../../customers/application/customers.service";
import { EventsService } from "../../events/application/events.service";
import { PaymentsService } from "../../finance/application/payments.service";
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
- REGISTRAR/EDITAR compras (pedidos a fornecedor): propose_create_purchase / propose_edit_purchase.
- REGISTRAR vendas (varejo ou atacado): propose_create_sale. Pode ser valor livre (amount+title) ou itens; cliente existente, novo, ou consumidor.
- CONSULTAR (respostas diretas, sem aprovação): vendas/faturamento (sales_summary, find_sales), financeiro (finance_status) e estoque (stock_status).
Regras:
- Fale em português do Brasil, com frases curtas e claras. Formate valores em R$.
- Para consultas, chame a ferramenta certa e responda com os números (datas relativas como "essa semana"/"esse mês" você converte para AAAA-MM-DD).
- Antes de propor, use as buscas (fornecedor/produto/cliente). Se houver mais de um parecido, PERGUNTE qual é; se não existir, ofereça cadastrar (inclua no rascunho).
- Compra: pergunte se JÁ FOI ENTREGUE. Venda: pergunte se JÁ FOI PAGA (à vista) e se já foi ENTREGUE.
- Assim que tiver o essencial, CHAME a ferramenta propose_* — não fique só resumindo em texto. Só escreve via propose_* (o usuário aprova). NUNCA afirme que gravou sem a aprovação.
- Cadastrar cliente/produto avulso e ajustar estoque ainda não estão disponíveis como ação — se pedirem, avise.`;

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
    private readonly customersService: CustomersService,
    private readonly eventsService: EventsService,
    private readonly paymentsService: PaymentsService,
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

        // Toda tool_use precisa de um tool_result. Propostas válidas encerram o
        // loop (abrem o modal); propostas INVÁLIDAS voltam como erro para o
        // modelo se auto-corrigir (não damos dead-end no usuário).
        const toolResults = [];
        let validDraft: AssistantDraft | null = null;
        for (const call of result.toolCalls) {
          if (this.tools.isProposal(call.name)) {
            const parsed = this.tools.tryParseDraft(call);
            if (parsed.ok) {
              validDraft = parsed.draft;
              toolResults.push({
                toolCallId: call.id,
                content: "Rascunho recebido — aguardando o usuário aprovar.",
              });
            } else {
              this.logger.warn(`Rascunho inválido (${call.name}): ${parsed.error}`);
              toolResults.push({
                toolCallId: call.id,
                content: `Rascunho inválido: ${parsed.error}. Corrija e proponha de novo.`,
              });
            }
          } else {
            toolResults.push({
              toolCallId: call.id,
              content: await this.tools.runRead(call),
            });
          }
        }
        working.push({ role: "tool", toolResults });
        if (validDraft) {
          return { messages: working, reply: result.text, draft: validDraft };
        }
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
    if (draft.kind === CREATE_PURCHASE) return this.executeCreate(draft);
    if (draft.kind === CREATE_SALE) return this.executeCreateSale(draft);
    return this.executeEdit(draft);
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
      recordId: purchase.id,
      href: `/compras/${purchase.id}`,
      created: {
        supplier: createdSupplier,
        products: createdProductIds.length,
        customer: false,
      },
      message: draft.delivered
        ? "Compra registrada e recebida no estoque."
        : "Pedido registrado.",
    };
  }

  private async executeCreateSale(
    draft: CreateSaleDraft,
  ): Promise<AssistantExecuteResult> {
    if ((draft.amount ?? 0) <= 0 && (draft.items?.length ?? 0) === 0) {
      throw new BadRequestException("Informe o valor ou os itens da venda.");
    }

    // 1) Cliente: existente, novo, ou consumidor (sem cliente).
    let customerId = draft.customerId ?? null;
    let createdCustomer = false;
    if (!customerId && draft.newCustomer?.name) {
      const customer = await this.customersService.create(
        customerInputSchema.parse({
          name: draft.newCustomer.name,
          whatsapp: draft.newCustomer.whatsapp,
          channel: draft.channel,
        }),
      );
      customerId = customer.id;
      createdCustomer = true;
    }

    // 2) Venda (valor livre ou itens).
    const sale = await this.eventsService.quickSale(
      quickSaleSchema.parse({
        customerId: customerId ?? undefined,
        channel: draft.channel,
        date: draft.date,
        dueDate: draft.paid ? undefined : draft.dueDate,
        delivered: draft.delivered,
        ...(draft.items?.length
          ? {
              items: draft.items.map((it) => ({
                productId: it.productId ?? undefined,
                arrangementId: it.arrangementId ?? undefined,
                quantity: it.quantity,
                saleUnit: it.unit,
                unitSalePrice: it.unitSalePrice,
              })),
            }
          : { amount: draft.amount, title: draft.title }),
      }),
    );

    // 3) À vista → registra o recebimento (retroagido à data da venda).
    if (draft.paid && sale.soldValue > 0) {
      await this.paymentsService.receiveForEvent(
        sale.id,
        paymentInputSchema.parse({
          amount: sale.soldValue,
          method: "PIX",
          date: draft.date,
        }),
      );
    }

    const href =
      draft.channel === "WHOLESALE" ? `/atacado/${sale.id}` : `/vendas/${sale.id}`;
    return {
      recordId: sale.id,
      href,
      created: { supplier: false, products: 0, customer: createdCustomer },
      message: draft.paid
        ? "Venda registrada e recebida."
        : "Venda registrada (a prazo).",
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
      recordId: draft.purchaseId,
      href: `/compras/${draft.purchaseId}`,
      created: { supplier: false, products: 0, customer: false },
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
