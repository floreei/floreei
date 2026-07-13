import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  AssistantActionEntry,
  AssistantConversation,
  AssistantConversationSummary,
  AssistantLog,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { AssistantActionEntity } from "../infrastructure/assistant-action.entity";
import { AssistantConversationEntity } from "../infrastructure/assistant-conversation.entity";
import { AssistantMessageEntity } from "../infrastructure/assistant-message.entity";

const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

/**
 * Histórico do assistente por empresa: transcript das conversas e auditoria das
 * ações executadas. Escopo por companyId explícito (o gestor também consulta).
 */
@Injectable()
export class AssistantHistoryService {
  constructor(
    @InjectRepository(AssistantConversationEntity)
    private readonly conversations: Repository<AssistantConversationEntity>,
    @InjectRepository(AssistantMessageEntity)
    private readonly messages: Repository<AssistantMessageEntity>,
    @InjectRepository(AssistantActionEntity)
    private readonly actions: Repository<AssistantActionEntity>,
  ) {}

  /** Reusa a conversa (se veio id) ou cria uma nova com título = 1ª fala. */
  async ensureConversation(
    companyId: string,
    userId: string | undefined,
    conversationId: string | null | undefined,
    firstUserText: string,
  ): Promise<string> {
    if (conversationId) {
      const existing = await this.conversations.findOne({
        where: { id: conversationId, companyId },
      });
      if (existing) return existing.id;
    }
    const conv = await this.conversations.save(
      this.conversations.create({
        companyId,
        userId: userId ?? null,
        title: truncate(firstUserText.trim() || "Conversa", 160),
      }),
    );
    return conv.id;
  }

  /** Grava um turno (fala do usuário + resposta do assistente) no transcript. */
  async recordTurn(
    conversationId: string,
    companyId: string,
    userText: string,
    assistantText: string,
  ): Promise<void> {
    await this.messages.save([
      this.messages.create({ conversationId, companyId, role: "user", text: userText }),
      this.messages.create({
        conversationId,
        companyId,
        role: "assistant",
        text: assistantText || "…",
      }),
    ]);
    await this.conversations.update(conversationId, { updatedAt: new Date() });
  }

  async recordAction(
    companyId: string,
    userId: string | undefined,
    conversationId: string | null | undefined,
    kind: string,
    summary: string,
    href: string,
  ): Promise<void> {
    await this.actions.save(
      this.actions.create({
        companyId,
        userId: userId ?? null,
        conversationId: conversationId ?? null,
        kind,
        summary: truncate(summary, 300),
        href: truncate(href, 200),
      }),
    );
  }

  async listConversations(
    companyId: string,
    limit = 30,
  ): Promise<AssistantConversationSummary[]> {
    const rows = await this.conversations.find({
      where: { companyId },
      order: { updatedAt: "DESC" },
      take: limit,
    });
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async getConversation(
    companyId: string,
    id: string,
  ): Promise<AssistantConversation> {
    const conv = await this.conversations.findOne({ where: { id, companyId } });
    if (!conv) throw new NotFoundException("Conversa não encontrada.");
    const msgs = await this.messages.find({
      where: { conversationId: id },
      order: { createdAt: "ASC" },
    });
    return {
      id: conv.id,
      title: conv.title,
      messages: msgs.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async listActions(companyId: string, limit = 30): Promise<AssistantActionEntry[]> {
    const rows = await this.actions.find({
      where: { companyId },
      order: { createdAt: "DESC" },
      take: limit,
    });
    return rows.map((a) => ({
      id: a.id,
      kind: a.kind,
      summary: a.summary,
      href: a.href,
      conversationId: a.conversationId,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /** Consolidado para o console do gestor. */
  async log(companyId: string): Promise<AssistantLog> {
    const [actions, conversations] = await Promise.all([
      this.listActions(companyId, 20),
      this.listConversations(companyId, 20),
    ]);
    return { actions, conversations };
  }
}
