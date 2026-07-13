import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  assistantChatRequestSchema,
  assistantDraftSchema,
} from "@sistema-flores/types";
import { createZodDto } from "nestjs-zod";
import { RequiresFeature } from "../../../common/auth/feature.guard";
import { AssistantService } from "../application/assistant.service";

class ChatDto extends createZodDto(assistantChatRequestSchema) {}

/** Assistente de IA. Autenticado + feature ASSISTANT. */
@RequiresFeature("ASSISTANT")
@Controller("assistant")
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  /** Uso e cota do assistente no mês (tokens) — o cliente vê o que resta. */
  @Get("usage")
  usage() {
    return this.assistant.usageSummary();
  }

  /** Ações executadas (auditoria) da empresa. */
  @Get("history")
  history() {
    return this.assistant.listActions();
  }

  /** Conversas recentes da empresa. */
  @Get("conversations")
  conversations() {
    return this.assistant.listConversations();
  }

  /** Transcript de uma conversa. */
  @Get("conversations/:id")
  conversation(@Param("id", ParseUUIDPipe) id: string) {
    return this.assistant.getConversation(id);
  }

  /** Um turno da conversa: devolve texto (pergunta) ou um rascunho para aprovar. */
  @Post("chat")
  chat(@Body() dto: ChatDto) {
    return this.assistant.chat(dto.messages, dto.conversationId);
  }

  /**
   * Executa o rascunho aprovado. Valida manualmente: o `createZodDto` não
   * suporta união discriminada (o corpo é o rascunho). `conversationId` (query)
   * liga a ação à conversa no histórico.
   */
  @Post("execute")
  execute(@Body() body: unknown, @Query("conversationId") conversationId?: string) {
    const parsed = assistantDraftSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Rascunho de ação inválido.");
    }
    return this.assistant.execute(parsed.data, conversationId);
  }
}
