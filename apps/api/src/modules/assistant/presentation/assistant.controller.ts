import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common";
import {
  assistantChatRequestSchema,
  assistantDraftSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../../common/auth/feature.guard";
import { AssistantService } from "../application/assistant.service";

class ChatDto extends createZodDto(assistantChatRequestSchema) {}

/** Assistente de IA (v1 — compras). Autenticado + feature ASSISTANT. */
@RequiresFeature("ASSISTANT")
@Controller("assistant")
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  /** Uso e cota do assistente no mês (tokens) — o cliente vê o que resta. */
  @Get("usage")
  usage() {
    return this.assistant.usageSummary();
  }

  /** Um turno da conversa: devolve texto (pergunta) ou um rascunho para aprovar. */
  @Post("chat")
  chat(@Body() dto: ChatDto) {
    return this.assistant.chat(dto.messages);
  }

  /**
   * Executa o rascunho aprovado (cria/edita a compra). Valida manualmente: o
   * `createZodDto` não suporta união discriminada (o corpo é o rascunho).
   */
  @Post("execute")
  execute(@Body() body: unknown) {
    const parsed = assistantDraftSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Rascunho de ação inválido.");
    }
    return this.assistant.execute(parsed.data);
  }
}
