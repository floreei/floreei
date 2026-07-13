import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import {
  ADJUST_STOCK,
  arrangementInputSchema,
  CREATE_ARRANGEMENT,
  CREATE_CUSTOMER,
  CREATE_EXPENSE,
  CREATE_PRODUCT,
  CREATE_PURCHASE,
  CREATE_SALE,
  CREATE_SALES_BATCH,
  customerInputSchema,
  expenseInputSchema,
  paymentInputSchema,
  productInputSchema,
  purchaseInputSchema,
  quickSaleSchema,
  REGISTER_PAYMENT,
  stockAdjustSchema,
  supplierInputSchema,
  type AdjustStockDraft,
  type AiMessage,
  type AssistantChatResponse,
  type BatchSale,
  type CreateSalesBatchDraft,
  type Event,
  type AssistantDraft,
  type AssistantExecuteResult,
  type AssistantUsageSummary,
  type CreateArrangementDraft,
  type CreateCustomerDraft,
  type CreateExpenseDraft,
  type CreateProductDraft,
  type CreatePurchaseDraft,
  type CreateSaleDraft,
  type EditPurchaseDraft,
  type RegisterPaymentDraft,
} from "@sistema-flores/types";
import { AssistantHistoryService } from "./assistant-history.service";
import { ArrangementsService } from "../../arrangements/application/arrangements.service";
import { CategoryRepository } from "../../catalog/infrastructure/category.repository";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { ProductsService } from "../../catalog/application/products.service";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CustomersService } from "../../customers/application/customers.service";
import { EventsService } from "../../events/application/events.service";
import { ExpensesService } from "../../expenses/expenses.module";
import { PaymentsService } from "../../finance/application/payments.service";
import { PurchasesService } from "../../purchases/application/purchases.service";
import { StockService } from "../../stock/application/stock.service";
import { SuppliersService } from "../../suppliers/suppliers.module";
import { AI_PROVIDER, type AiProvider } from "../ai/ai-provider";
import { AssistantUsageService } from "./assistant-usage.service";
import { AssistantTools } from "./assistant.tools";

const MAX_STEPS = 6;
const DEFAULT_CATEGORY = "Diversos";
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Última fala de texto do usuário (para título/transcript). */
function lastUserText(messages: AiMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].text) return messages[i].text!;
  }
  return "";
}

const DRAFT_LABELS: Record<string, string> = {
  CREATE_PURCHASE: "Propôs registrar uma compra.",
  EDIT_PURCHASE: "Propôs alterar uma compra.",
  CREATE_SALE: "Propôs registrar uma venda.",
  CREATE_SALES_BATCH: "Propôs registrar várias vendas.",
  CREATE_CUSTOMER: "Propôs cadastrar um cliente.",
  CREATE_PRODUCT: "Propôs cadastrar um produto.",
  CREATE_ARRANGEMENT: "Propôs cadastrar um buquê.",
  ADJUST_STOCK: "Propôs ajustar o estoque.",
  CREATE_EXPENSE: "Propôs registrar uma despesa.",
  REGISTER_PAYMENT: "Propôs registrar um pagamento.",
};

const systemPrompt = () => `Você é o assistente do Floreei, um sistema para floriculturas.
Hoje é ${new Date().toISOString().slice(0, 10)}.
Ajude o lojista por conversa natural, do usuário leigo ao expert.
Ações de ESCRITA (sempre via propose_*, o usuário aprova):
- Compras: propose_create_purchase / propose_edit_purchase.
- Vendas (varejo/atacado): propose_create_sale (valor livre ou itens; cliente existente/novo/consumidor). Se o usuário mandar uma LISTA (vários clientes de uma vez), use propose_create_sales_batch (uma venda por cliente); busque cada cliente/produto; produtos que não existirem vão em newProducts; item sem preço usa 0 (pega o padrão do produto).
- Cadastros: propose_create_customer, propose_create_product, propose_create_arrangement (buquê).
- Estoque: propose_adjust_stock (newBalance = saldo FINAL; consulte o atual com stock_status e some/subtraia).
- Financeiro: propose_create_expense (despesa a pagar); propose_register_payment (receber de cliente = target EVENT via find_sales; pagar fornecedor = target PURCHASE via find_purchases).
CONSULTAS (resposta direta, sem aprovação): sales_summary, find_sales, finance_status, stock_status.
Regras:
- Português do Brasil, frases curtas, valores em R$. Datas relativas ("essa semana") você converte para AAAA-MM-DD.
- Antes de propor, use as buscas (search_suppliers/products/customers, find_sales/find_purchases). Se houver mais de um parecido, PERGUNTE qual é; se não existir, ofereça cadastrar.
- Compra: pergunte se JÁ FOI ENTREGUE. Venda: pergunte se JÁ FOI PAGA e se já foi ENTREGUE.
- Assim que tiver o essencial, CHAME a ferramenta propose_* — não fique só resumindo em texto. Só grava via propose_* aprovado. NUNCA afirme que gravou sem a aprovação.`;

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
    private readonly history: AssistantHistoryService,
    private readonly tenant: TenantContextService,
    private readonly suppliersService: SuppliersService,
    private readonly productsService: ProductsService,
    private readonly purchasesService: PurchasesService,
    private readonly customersService: CustomersService,
    private readonly eventsService: EventsService,
    private readonly paymentsService: PaymentsService,
    private readonly arrangementsService: ArrangementsService,
    private readonly expensesService: ExpensesService,
    private readonly stockService: StockService,
    private readonly categories: CategoryRepository,
    private readonly productRepo: ProductRepository,
  ) {}

  async chat(
    messages: AiMessage[],
    conversationId?: string | null,
  ): Promise<AssistantChatResponse> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    if (!(await this.usage.withinQuota(companyId))) {
      throw new HttpException(
        "Você atingiu a cota de uso do assistente neste mês. Fale com o suporte para liberar mais.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const response = await this.runTurns(companyId, messages);

    // Persiste o transcript (best-effort — nunca derruba o chat).
    try {
      const userText = lastUserText(messages);
      if (userText) {
        const assistantText =
          response.reply ??
          (response.draft ? DRAFT_LABELS[response.draft.kind] ?? "" : "");
        const convId = await this.history.ensureConversation(
          companyId,
          this.tenant.getUserId(),
          conversationId,
          userText,
        );
        await this.history.recordTurn(convId, companyId, userText, assistantText);
        response.conversationId = convId;
      }
    } catch (err) {
      this.logger.warn(
        `Falha ao gravar histórico: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return response;
  }

  private async runTurns(
    companyId: string,
    messages: AiMessage[],
  ): Promise<AssistantChatResponse> {
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

  /** Uso e cota do assistente da empresa atual (visível ao próprio cliente). */
  usageSummary(): Promise<AssistantUsageSummary> {
    return this.usage.summary(this.tenant.getCompanyIdOrThrow());
  }

  async execute(
    draft: AssistantDraft,
    conversationId?: string | null,
  ): Promise<AssistantExecuteResult> {
    const result = await this.runExecute(draft);
    // Auditoria da ação executada (best-effort).
    try {
      await this.history.recordAction(
        this.tenant.getCompanyIdOrThrow(),
        this.tenant.getUserId(),
        conversationId,
        draft.kind,
        result.message,
        result.href,
      );
    } catch (err) {
      this.logger.warn(
        `Falha ao gravar ação: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return result;
  }

  /** Métodos de leitura do histórico (para o cliente e o gestor). */
  listConversations(companyId?: string) {
    return this.history.listConversations(companyId ?? this.tenant.getCompanyIdOrThrow());
  }
  getConversation(id: string, companyId?: string) {
    return this.history.getConversation(companyId ?? this.tenant.getCompanyIdOrThrow(), id);
  }
  listActions(companyId?: string) {
    return this.history.listActions(companyId ?? this.tenant.getCompanyIdOrThrow());
  }

  private runExecute(draft: AssistantDraft): Promise<AssistantExecuteResult> {
    switch (draft.kind) {
      case CREATE_PURCHASE:
        return this.executeCreate(draft);
      case CREATE_SALE:
        return this.executeCreateSale(draft);
      case CREATE_SALES_BATCH:
        return this.executeCreateSalesBatch(draft);
      case CREATE_CUSTOMER:
        return this.executeCreateCustomer(draft);
      case CREATE_PRODUCT:
        return this.executeCreateProduct(draft);
      case CREATE_ARRANGEMENT:
        return this.executeCreateArrangement(draft);
      case ADJUST_STOCK:
        return this.executeAdjustStock(draft);
      case CREATE_EXPENSE:
        return this.executeCreateExpense(draft);
      case REGISTER_PAYMENT:
        return this.executeRegisterPayment(draft);
      default:
        return this.executeEdit(draft);
    }
  }

  private async executeCreateCustomer(
    draft: CreateCustomerDraft,
  ): Promise<AssistantExecuteResult> {
    const customer = await this.customersService.create(
      customerInputSchema.parse({
        name: draft.name,
        whatsapp: draft.whatsapp,
        phone: draft.phone,
        channel: draft.channel,
      }),
    );
    return {
      recordId: customer.id,
      href: `/clientes/${customer.id}`,
      created: { supplier: false, products: 0, customer: true },
      message: `Cliente ${customer.name} cadastrado.`,
    };
  }

  private async executeCreateProduct(
    draft: CreateProductDraft,
  ): Promise<AssistantExecuteResult> {
    const categoryId = await this.defaultCategoryId();
    const product = await this.productsService.create(
      productInputSchema.parse({
        categoryId,
        name: draft.name,
        unit: draft.unit,
        defaultSalePrice: draft.defaultSalePrice,
        defaultPurchasePrice: draft.defaultPurchasePrice,
      }),
    );
    return {
      recordId: product.id,
      href: `/produtos`,
      created: { supplier: false, products: 1, customer: false },
      message: `Produto ${product.name} cadastrado.`,
    };
  }

  private async executeCreateArrangement(
    draft: CreateArrangementDraft,
  ): Promise<AssistantExecuteResult> {
    const arrangement = await this.arrangementsService.create(
      arrangementInputSchema.parse({
        name: draft.name,
        salePrice: draft.salePrice,
        pricingMode: "FIXED",
      }),
    );
    return {
      recordId: arrangement.id,
      href: `/buques`,
      created: { supplier: false, products: 0, customer: false },
      message: `Buquê ${arrangement.name} cadastrado.`,
    };
  }

  private async executeAdjustStock(
    draft: AdjustStockDraft,
  ): Promise<AssistantExecuteResult> {
    await this.stockService.adjustBalance(
      stockAdjustSchema.parse({
        productId: draft.productId,
        balance: draft.newBalance,
        notes: draft.notes,
      }),
    );
    return {
      recordId: draft.productId,
      href: `/estoque`,
      created: { supplier: false, products: 0, customer: false },
      message: `Estoque de ${draft.productName} ajustado para ${draft.newBalance}.`,
    };
  }

  private async executeCreateExpense(
    draft: CreateExpenseDraft,
  ): Promise<AssistantExecuteResult> {
    const expense = await this.expensesService.create(
      expenseInputSchema.parse({
        description: draft.description,
        costCenter: draft.costCenter,
        amount: draft.amount,
        dueDate: draft.dueDate,
        notes: draft.notes,
      }),
    );
    return {
      recordId: expense.id,
      href: `/financeiro`,
      created: { supplier: false, products: 0, customer: false },
      message: `Despesa "${draft.description}" registrada.`,
    };
  }

  private async executeRegisterPayment(
    draft: RegisterPaymentDraft,
  ): Promise<AssistantExecuteResult> {
    const allowed = ["PIX", "CASH", "CARD", "TRANSFER", "BOLETO", "OTHER"];
    const method = allowed.includes(draft.method ?? "") ? draft.method : "PIX";
    const payment = paymentInputSchema.parse({
      amount: draft.amount,
      method,
      date: draft.date,
    });
    if (draft.target === "EVENT") {
      await this.paymentsService.receiveForEvent(draft.targetId, payment);
      return {
        recordId: draft.targetId,
        href: `/vendas/${draft.targetId}`,
        created: { supplier: false, products: 0, customer: false },
        message: "Recebimento registrado.",
      };
    }
    await this.paymentsService.payForPurchase(draft.targetId, payment);
    return {
      recordId: draft.targetId,
      href: `/compras/${draft.targetId}`,
      created: { supplier: false, products: 0, customer: false },
      message: "Pagamento registrado.",
    };
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
    const { event, createdCustomer, createdProducts } =
      await this.createOneSale(draft);
    const href =
      draft.channel === "WHOLESALE" ? `/atacado/${event.id}` : `/vendas/${event.id}`;
    return {
      recordId: event.id,
      href,
      created: { supplier: false, products: createdProducts, customer: createdCustomer },
      message: draft.paid
        ? "Venda registrada e recebida."
        : "Venda registrada (a prazo).",
    };
  }

  private async executeCreateSalesBatch(
    draft: CreateSalesBatchDraft,
  ): Promise<AssistantExecuteResult> {
    let firstId = "";
    let customers = 0;
    for (const sale of draft.sales) {
      const { event, createdCustomer } = await this.createOneSale(sale);
      if (!firstId) firstId = event.id;
      if (createdCustomer) customers += 1;
    }
    const n = draft.sales.length;
    // Todas atacado → lista de atacado; senão, vendas (varejo cobre os dois).
    const href = draft.sales.every((s) => s.channel === "WHOLESALE")
      ? "/atacado"
      : "/vendas";
    return {
      recordId: firstId,
      href,
      created: { supplier: false, products: 0, customer: customers > 0 },
      message: `${n} ${n === 1 ? "venda registrada" : "vendas registradas"}.`,
    };
  }

  /** Cria uma venda (cliente/produtos inline + recebimento à vista). */
  private async createOneSale(
    sale: BatchSale,
  ): Promise<{ event: Event; createdCustomer: boolean; createdProducts: number }> {
    if ((sale.amount ?? 0) <= 0 && (sale.items?.length ?? 0) === 0) {
      throw new BadRequestException("Informe o valor ou os itens da venda.");
    }
    const date = sale.date ?? todayISO();

    // Cliente: existente, novo, ou consumidor.
    let customerId = sale.customerId ?? null;
    let createdCustomer = false;
    if (!customerId && sale.newCustomer?.name) {
      const customer = await this.customersService.create(
        customerInputSchema.parse({
          name: sale.newCustomer.name,
          whatsapp: sale.newCustomer.whatsapp,
          channel: sale.channel,
        }),
      );
      customerId = customer.id;
      createdCustomer = true;
    }

    // Produtos novos (categoria "Diversos").
    const createdProductIds: string[] = [];
    if (sale.newProducts.length) {
      const categoryId = await this.defaultCategoryId();
      for (const np of sale.newProducts) {
        const product = await this.productsService.create(
          productInputSchema.parse({ categoryId, name: np.name, unit: np.unit }),
        );
        createdProductIds.push(product.id);
      }
    }

    // Resolve cada item para um produto real: existente (id) → novo (índice) →
    // por nome (acha ou cria). Nunca deixa um item sem produto (evita 500).
    let quickItems:
      | Array<{
          productId?: string;
          arrangementId?: string;
          quantity: number;
          saleUnit?: string;
          unitSalePrice: number;
        }>
      | undefined;
    if (sale.items?.length) {
      quickItems = [];
      for (const it of sale.items) {
        let productId = it.productId ?? undefined;
        if (!productId && it.newProductRef != null) {
          productId = createdProductIds[it.newProductRef];
        }
        if (!productId && !it.arrangementId) {
          productId = await this.resolveProductByName(
            it.description,
            it.unit,
            it.unitSalePrice,
          );
        }
        quickItems.push({
          productId: productId ?? undefined,
          arrangementId: it.arrangementId ?? undefined,
          quantity: it.quantity,
          saleUnit: it.unit,
          unitSalePrice: it.unitSalePrice,
        });
      }
    }

    const event = await this.eventsService.quickSale(
      quickSaleSchema.parse({
        customerId: customerId ?? undefined,
        channel: sale.channel,
        date,
        deliveryDate: sale.deliveryDate,
        dueDate: sale.paid ? undefined : sale.dueDate,
        delivered: sale.delivered,
        ...(quickItems
          ? { items: quickItems }
          : { amount: sale.amount, title: sale.title }),
      }),
    );

    if (sale.paid && event.soldValue > 0) {
      await this.paymentsService.receiveForEvent(
        event.id,
        paymentInputSchema.parse({ amount: event.soldValue, method: "PIX", date }),
      );
    }

    return { event, createdCustomer, createdProducts: createdProductIds.length };
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

  /** Acha um produto pelo nome (exato, case-insensitive) ou cria um novo. */
  private async resolveProductByName(
    name: string,
    unit: string | undefined,
    salePrice: number,
  ): Promise<string> {
    const existing = await this.productRepo
      .qb("p")
      .andWhere("p.name ILIKE :n", { n: name })
      .getOne();
    if (existing) return existing.id;
    const categoryId = await this.defaultCategoryId();
    const created = await this.productsService.create(
      productInputSchema.parse({
        categoryId,
        name,
        unit: unit ?? "UNIDADE",
        defaultSalePrice: salePrice,
      }),
    );
    return created.id;
  }
}
