import type { AiMessage, AiToolCall } from "@sistema-flores/types";
import type { AiCompleteRequest, AiCompleteResult, AiProvider } from "./ai-provider";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

/**
 * Provedor de IA via Anthropic (Claude), REST sem SDK — mesmo molde do
 * EmailService. Traduz o formato normalizado `AiMessage[]` para o formato de
 * mensagens/ferramentas do Claude e de volta. Ativado quando `ANTHROPIC_API_KEY`
 * existe; a escolha do provedor é plugável (trocar aqui não afeta o resto).
 */
export class AnthropicAiProvider implements AiProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string,
    // Tarefa é extração/classificação com tools — um modelo leve (Haiku) resolve
    // barato. Ajustável por env.
    private readonly model = process.env.ASSISTANT_MODEL ?? "claude-haiku-4-5-20251001",
  ) {}

  async complete(req: AiCompleteRequest): Promise<AiCompleteResult> {
    // O prefixo estático (system + tools) é cacheado (cache_control ephemeral):
    // corta ~90% do custo de input nos turnos seguintes da mesma conversa.
    const tools = req.tools.map((t, i) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
      ...(i === req.tools.length - 1
        ? { cache_control: { type: "ephemeral" as const } }
        : {}),
    }));

    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: req.system,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools,
        messages: req.messages.map(toAnthropic),
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic: falha (${res.status}) ${await res.text()}`);
    }

    const data = (await res.json()) as {
      content: Array<
        | { type: "text"; text: string }
        | { type: "tool_use"; id: string; name: string; input: unknown }
      >;
    };

    const text = data.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const toolCalls: AiToolCall[] = data.content
      .filter(
        (b): b is { type: "tool_use"; id: string; name: string; input: unknown } =>
          b.type === "tool_use",
      )
      .map((b) => ({ id: b.id, name: b.name, input: b.input }));

    return {
      text: text || undefined,
      toolCalls: toolCalls.length ? toolCalls : undefined,
    };
  }
}

/** Traduz uma mensagem normalizada para o formato do Claude. */
function toAnthropic(m: AiMessage): {
  role: "user" | "assistant";
  content: unknown[];
} {
  if (m.role === "tool") {
    return {
      role: "user",
      content: (m.toolResults ?? []).map((r) => ({
        type: "tool_result",
        tool_use_id: r.toolCallId,
        content: r.content,
      })),
    };
  }
  if (m.role === "assistant") {
    const content: unknown[] = [];
    if (m.text) content.push({ type: "text", text: m.text });
    for (const c of m.toolCalls ?? []) {
      content.push({ type: "tool_use", id: c.id, name: c.name, input: c.input });
    }
    return { role: "assistant", content };
  }
  return { role: "user", content: [{ type: "text", text: m.text ?? "" }] };
}
