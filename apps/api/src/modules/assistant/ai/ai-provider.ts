import type { AiMessage, AiToolCall, AiUsage } from "@sistema-flores/types";

/** Token de injeção do provedor de IA (plugável — molde do EmailService). */
export const AI_PROVIDER = "AI_PROVIDER";

/** Definição de uma ferramenta exposta ao modelo (JSON Schema dos argumentos). */
export interface AiToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiCompleteRequest {
  system: string;
  messages: AiMessage[];
  tools: AiToolDef[];
  /** Id opaco da empresa → metadata.user_id (abuso), nunca PII. */
  userId?: string;
}

/** Resultado de um passo do modelo: ou texto, ou chamadas de ferramenta. */
export interface AiCompleteResult {
  text?: string;
  toolCalls?: AiToolCall[];
  /** Tokens consumidos neste passo (para medição por empresa). */
  usage?: AiUsage;
}

/**
 * Provedor de IA agnóstico. A implementação real (Anthropic/OpenAI/…) traduz o
 * formato normalizado `AiMessage[]` para o formato do provedor. Sem provedor
 * configurado, o módulo usa o `FakeAiProvider` (dev/testes).
 */
export interface AiProvider {
  readonly name: string;
  complete(req: AiCompleteRequest): Promise<AiCompleteResult>;
}

/** Sem provedor configurado (produção): responde indisponível de forma clara. */
export class NullAiProvider implements AiProvider {
  readonly name = "null";
  async complete(): Promise<AiCompleteResult> {
    const { ServiceUnavailableException } = await import("@nestjs/common");
    throw new ServiceUnavailableException(
      "O assistente de IA não está configurado no momento.",
    );
  }
}
