import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  AI_PROVIDER,
  type AiCompleteRequest,
  type AiCompleteResult,
  type AiProvider,
} from "../src/modules/assistant/ai/ai-provider";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

/** Provedor determinístico: devolve as respostas enfileiradas, uma por passo. */
class ScriptedAiProvider implements AiProvider {
  readonly name = "scripted";
  queue: AiCompleteResult[] = [];
  async complete(_req: AiCompleteRequest): Promise<AiCompleteResult> {
    return this.queue.shift() ?? { text: "Sem mais passos." };
  }
}

const tool = (name: string, input: unknown) => ({
  toolCalls: [{ id: randomUUID(), name, input }],
});

describe("Assistente de IA (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const ai = new ScriptedAiProvider();

  beforeAll(async () => {
    ctx = await createTestApp((b) =>
      b.overrideProvider(AI_PROVIDER).useValue(ai),
    );
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "dono@assistente.com" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
    ai.queue = [];
  });

  it("propõe uma compra (fornecedor e produto novos) e executa criando tudo", async () => {
    // A IA busca o fornecedor (não acha) e propõe cadastrar tudo, já entregue.
    ai.queue = [
      tool("search_suppliers", { query: "Flora Nova" }),
      tool("propose_create_purchase", {
        supplierId: null,
        newSupplier: { name: "Flora Nova", city: "Holambra" },
        supplierName: "Flora Nova",
        newProducts: [{ name: "Hortênsia", unit: "MACO" }],
        items: [
          {
            newProductRef: 0,
            description: "Hortênsia",
            quantity: 10,
            unit: "MACO",
            unitPrice: 15,
          },
        ],
        delivered: true,
        date: "2026-07-13",
      }),
    ];

    const chat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "pedido de 10 hortênsias para Flora Nova, já entregue" }] })
      .expect(201);
    expect(chat.body.draft).toBeTruthy();
    expect(chat.body.draft.kind).toBe("CREATE_PURCHASE");
    expect(chat.body.draft.newProducts).toHaveLength(1);

    const exec = await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(chat.body.draft)
      .expect(201);
    expect(exec.body.created).toEqual({
      supplier: true,
      products: 1,
      customer: false,
    });
    expect(exec.body.href).toBe(`/compras/${exec.body.recordId}`);

    // Fornecedor, produto e compra (recebida) persistidos.
    const suppliers = await http
      .get("/api/suppliers")
      .query({ search: "Flora" })
      .set(bearer(token))
      .expect(200);
    expect(suppliers.body.data.some((s: { name: string }) => s.name === "Flora Nova")).toBe(true);

    const purchase = await http
      .get(`/api/purchases/${exec.body.recordId}`)
      .set(bearer(token))
      .expect(200);
    expect(purchase.body.status).toBe("RECEIVED");
    expect(purchase.body.items[0].description).toBe("Hortênsia");
    expect(purchase.body.items[0].productId).toBeTruthy(); // produto criado e vinculado
  });

  it("edita uma compra existente: marca como entregue", async () => {
    const supplier = await http
      .post("/api/suppliers")
      .set(bearer(token))
      .send({ name: "Ceasa" })
      .expect(201);
    const created = await http
      .post("/api/purchases")
      .set(bearer(token))
      .send({
        supplierId: supplier.body.id,
        date: "2026-07-12",
        status: "ORDERED",
        items: [{ description: "Rosa", quantity: 5, unit: "MACO", unitPrice: 4 }],
      })
      .expect(201);

    ai.queue = [
      tool("find_purchases", {}),
      tool("propose_edit_purchase", {
        purchaseId: created.body.id,
        purchaseLabel: "Compra de Ceasa em 12/07",
        changes: { delivered: true },
      }),
    ];

    const chat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "marca o pedido da Ceasa como entregue" }] })
      .expect(201);
    expect(chat.body.draft.kind).toBe("EDIT_PURCHASE");

    await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(chat.body.draft)
      .expect(201);

    const after = await http
      .get(`/api/purchases/${created.body.id}`)
      .set(bearer(token))
      .expect(200);
    expect(after.body.status).toBe("RECEIVED");
  });

  it("bloqueia (429) quando a cota de tokens do mês é atingida", async () => {
    // Um turno gasta mais que a cota do trial (200k) → o próximo é barrado.
    ai.queue = [
      {
        text: "Certo!",
        usage: {
          inputTokens: 0,
          outputTokens: 250_000,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
        },
      },
    ];
    await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "oi" }] })
      .expect(201);

    ai.queue = [{ text: "de novo" }];
    await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "oi de novo" }] })
      .expect(429);
  });

  it("registra uma venda (cliente novo, à vista) e executa", async () => {
    ai.queue = [
      tool("search_customers", { query: "Maria" }),
      tool("propose_create_sale", {
        channel: "RETAIL",
        customerId: null,
        newCustomer: { name: "Maria Flores" },
        customerName: "Maria Flores",
        amount: 150,
        title: "3 buquês",
        paid: true,
        delivered: true,
        date: "2026-07-13",
      }),
    ];

    const chat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "vendi 3 buquês pra Maria por 150, já paga" }] })
      .expect(201);
    expect(chat.body.draft.kind).toBe("CREATE_SALE");

    const exec = await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(chat.body.draft)
      .expect(201);
    expect(exec.body.created.customer).toBe(true);
    expect(exec.body.href).toBe(`/vendas/${exec.body.recordId}`);

    const sale = await http
      .get(`/api/events/${exec.body.recordId}`)
      .set(bearer(token))
      .expect(200);
    expect(sale.body.soldValue).toBe(150);
    expect(sale.body.receivedValue).toBe(150); // à vista → recebido
  });

  it("rascunho inválido volta ao modelo (não dá dead-end)", async () => {
    // 1º passo: proposta inválida (sem fornecedor/itens). 2º: o modelo corrige
    // com uma pergunta (texto). O usuário não vê erro de sistema.
    ai.queue = [
      tool("propose_create_purchase", { supplierName: "" }),
      { text: "Faltou o fornecedor e os itens. Qual fornecedor e o que comprou?" },
    ];
    const chat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "registra uma compra" }] })
      .expect(201);
    expect(chat.body.draft).toBeUndefined();
    expect(chat.body.reply).toContain("fornecedor");
  });

  it("cadastra cliente e registra despesa", async () => {
    ai.queue = [
      tool("propose_create_customer", { name: "João Silva", whatsapp: "11999998888" }),
    ];
    const cChat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "cadastra o joão" }] })
      .expect(201);
    expect(cChat.body.draft.kind).toBe("CREATE_CUSTOMER");
    const cExec = await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(cChat.body.draft)
      .expect(201);
    expect(cExec.body.created.customer).toBe(true);

    ai.queue = [
      tool("propose_create_expense", {
        description: "Aluguel",
        costCenter: "Fixo",
        amount: 800,
        dueDate: "2026-07-20",
      }),
    ];
    const eChat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "registra despesa de aluguel 800" }] })
      .expect(201);
    expect(eChat.body.draft.kind).toBe("CREATE_EXPENSE");
    const eExec = await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(eChat.body.draft)
      .expect(201);
    expect(eExec.body.message).toContain("Aluguel");
  });

  it("ajusta estoque e dá baixa (recebimento) de uma venda", async () => {
    const cat = await http
      .post("/api/categories")
      .set(bearer(token))
      .send({ name: "Rosas" })
      .expect(201);
    const prod = await http
      .post("/api/products")
      .set(bearer(token))
      .send({ categoryId: cat.body.id, name: "Rosa Vermelha", unit: "HASTE" })
      .expect(201);

    ai.queue = [
      tool("propose_adjust_stock", {
        productId: prod.body.id,
        productName: "Rosa Vermelha",
        newBalance: 50,
      }),
    ];
    const sChat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "coloca 50 rosas no estoque" }] })
      .expect(201);
    expect(sChat.body.draft.kind).toBe("ADJUST_STOCK");
    await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(sChat.body.draft)
      .expect(201);
    const overview = await http.get("/api/stock/overview").set(bearer(token)).expect(200);
    const level = overview.body.levels.find(
      (l: { productId: string }) => l.productId === prod.body.id,
    );
    expect(level.onHand).toBe(50);

    // Venda a prazo → baixa de recebimento.
    const sale = await http
      .post("/api/events/quick")
      .set(bearer(token))
      .send({ amount: 100, channel: "RETAIL" })
      .expect(201);
    ai.queue = [
      tool("propose_register_payment", {
        target: "EVENT",
        targetId: sale.body.id,
        label: "Venda direta",
        amount: 100,
        date: "2026-07-13",
      }),
    ];
    const pChat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "recebi 100 dessa venda" }] })
      .expect(201);
    expect(pChat.body.draft.kind).toBe("REGISTER_PAYMENT");
    await http
      .post("/api/assistant/execute")
      .set(bearer(token))
      .send(pChat.body.draft)
      .expect(201);
    const after = await http
      .get(`/api/events/${sale.body.id}`)
      .set(bearer(token))
      .expect(200);
    expect(after.body.receivedValue).toBe(100);
  });

  it("executa consultas de leitura (financeiro, vendas, estoque) sem erro", async () => {
    for (const [toolName, question] of [
      ["finance_status", "quanto tenho a receber?"],
      ["sales_summary", "quanto faturei esse mês?"],
      ["stock_status", "o que está acabando?"],
      ["find_sales", "minhas últimas vendas"],
    ] as const) {
      ai.queue = [tool(toolName, {}), { text: `resposta de ${toolName}` }];
      const res = await http
        .post("/api/assistant/chat")
        .set(bearer(token))
        .send({ messages: [{ role: "user", text: question }] })
        .expect(201);
      expect(res.body.reply).toBe(`resposta de ${toolName}`);
    }
  });

  it("faz uma pergunta quando a IA responde em texto (sem proposta)", async () => {
    ai.queue = [{ text: "Qual fornecedor você quer usar?" }];
    const chat = await http
      .post("/api/assistant/chat")
      .set(bearer(token))
      .send({ messages: [{ role: "user", text: "quero comprar rosas" }] })
      .expect(201);
    expect(chat.body.draft).toBeUndefined();
    expect(chat.body.reply).toContain("fornecedor");
  });
});
