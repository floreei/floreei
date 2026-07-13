import { randomUUID } from "node:crypto";
import type { AiMessage } from "@sistema-flores/types";
import type { AiCompleteRequest, AiCompleteResult, AiProvider } from "./ai-provider";

/**
 * Provedor heurístico para DEV/demo sem chave de IA (e como fallback). Não é uma
 * IA de verdade: dirige o fluxo canônico de compra/pedido a partir do texto do
 * usuário e dos resultados das ferramentas. Nos testes e2e, este provedor é
 * substituído por um roteiro determinístico (overrideProvider). Um provedor real
 * (Anthropic/OpenAI) é usado quando a env correspondente está configurada.
 */
export class FakeAiProvider implements AiProvider {
  readonly name = "fake";

  async complete(req: AiCompleteRequest): Promise<AiCompleteResult> {
    const userText = lastUserText(req.messages).toLowerCase();
    const used = toolNamesUsed(req.messages);
    const editing = isEditIntent(userText);

    // Fora do escopo do v1 (vendas/faturamento/relatórios) — orienta.
    if (!editing && !used.length && /(quanto|fatur|vend|relat[óo]ri)/.test(userText)) {
      return {
        text: "Por enquanto eu ajudo com compras e pedidos a fornecedor. Ex.: \"10 hortênsias para o fornecedor Flora\".",
      };
    }

    if (editing) {
      if (!used.includes("find_purchases")) {
        return call("find_purchases", {});
      }
      const purchases = parseResult(req.messages, "find_purchases")?.purchases ?? [];
      const target = purchases[0];
      if (!target) {
        return { text: "Não encontrei uma compra recente para ajustar." };
      }
      const changes = /entreg|recebi|chegou/.test(userText)
        ? { delivered: true }
        : { date: todayISO() };
      return call("propose_edit_purchase", {
        purchaseId: target.id,
        purchaseLabel: `Compra de ${target.supplierName ?? "fornecedor"} em ${target.date}`,
        changes,
      });
    }

    // Fluxo de criação de compra.
    if (!used.includes("search_suppliers")) {
      return call("search_suppliers", { query: extractSupplier(userText) });
    }
    if (!used.includes("search_products")) {
      return call("search_products", { query: extractProduct(userText) });
    }

    const suppliers = parseResult(req.messages, "search_suppliers")?.suppliers ?? [];
    const products = parseResult(req.messages, "search_products")?.products ?? [];
    const supplierName = extractSupplier(userText) || "Fornecedor";
    const productName = extractProduct(userText) || "Item";
    const qty = extractQuantity(userText);
    const delivered = /entreg|recebi|chegou|j[áa] veio/.test(userText);

    const supplier = suppliers[0];
    const product = products[0];

    // Não deu para entender o item — pede um comando mais claro (não inventa).
    if (!product && !productName) {
      return {
        text: "Me diga o item, a quantidade e o fornecedor. Ex.: \"10 hortênsias para o fornecedor Flora\".",
      };
    }

    const newProducts = product ? [] : [{ name: productName, unit: "UNIDADE" }];

    return call("propose_create_purchase", {
      supplierId: supplier?.id ?? null,
      newSupplier: supplier ? null : { name: supplierName },
      supplierName: supplier?.name ?? supplierName,
      newProducts,
      items: [
        {
          productId: product?.id ?? null,
          newProductRef: product ? null : 0,
          description: product?.name ?? productName,
          quantity: qty,
          unit: product?.unit ?? "UNIDADE",
          unitPrice: 0,
        },
      ],
      delivered,
      date: todayISO(),
    });
  }
}

function call(name: string, input: unknown): AiCompleteResult {
  return { toolCalls: [{ id: randomUUID(), name, input }] };
}

function lastUserText(messages: AiMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].text) return messages[i].text!;
  }
  return "";
}

function toolNamesUsed(messages: AiMessage[]): string[] {
  return messages.flatMap((m) => (m.toolCalls ?? []).map((c) => c.name));
}

/** Casa uma chamada de ferramenta ao seu resultado (por toolCallId) e parseia. */
function parseResult(
  messages: AiMessage[],
  toolName: string,
): Record<string, any> | null {
  let callId: string | null = null;
  for (const m of messages) {
    for (const c of m.toolCalls ?? []) {
      if (c.name === toolName) callId = c.id;
    }
    for (const r of m.toolResults ?? []) {
      if (callId && r.toolCallId === callId) {
        try {
          return JSON.parse(r.content);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function isEditIntent(text: string): boolean {
  return (
    /(marca|marque|muda|mude|alter|atualiz|corrig)/.test(text) &&
    /(pedido|compra)/.test(text)
  );
}

function extractQuantity(text: string): number {
  const m = text.match(/\d+/);
  return m ? Math.max(1, parseInt(m[0], 10)) : 1;
}

function extractSupplier(text: string): string {
  const m = text.match(/fornecedor(?:a)?\s+([a-zà-ú0-9 ]{2,40})/i);
  return m ? m[1].trim().replace(/\s+(por|de|com|que|hoje).*$/i, "").trim() : "";
}

function extractProduct(text: string): string {
  const m = text.match(/\d+\s+([a-zà-ú]{3,30})/i);
  return m ? m[1].trim() : "";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
