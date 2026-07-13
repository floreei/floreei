import type {
  AiMessage,
  AssistantActionEntry,
  AssistantChatResponse,
  AssistantConversation,
  AssistantConversationSummary,
  AssistantDraft,
  AssistantExecuteResult,
  AssistantUsageSummary,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const USAGE_KEY = ["assistant", "usage"];
const HISTORY_KEY = ["assistant", "history"];
const CONVERSATIONS_KEY = ["assistant", "conversations"];

/** Ações executadas (auditoria). */
export function useAssistantHistory(enabled = true) {
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: () => api.get<AssistantActionEntry[]>("/assistant/history"),
    enabled,
  });
}

/** Conversas recentes. */
export function useAssistantConversations(enabled = true) {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () =>
      api.get<AssistantConversationSummary[]>("/assistant/conversations"),
    enabled,
  });
}

/** Transcript de uma conversa. */
export function useAssistantConversation(id: string | null) {
  return useQuery({
    queryKey: ["assistant", "conversation", id],
    queryFn: () => api.get<AssistantConversation>(`/assistant/conversations/${id}`),
    enabled: Boolean(id),
  });
}

/** Uso e cota (tokens/mês) do assistente — o cliente vê o que resta. */
export function useAssistantUsage(enabled = true) {
  return useQuery({
    queryKey: USAGE_KEY,
    queryFn: () => api.get<AssistantUsageSummary>("/assistant/usage"),
    enabled,
    staleTime: 10_000,
  });
}

/** Um turno da conversa com o assistente. */
export function useAssistantChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { messages: AiMessage[]; conversationId?: string | null }) =>
      api.post<AssistantChatResponse>("/assistant/chat", {
        messages: input.messages,
        conversationId: input.conversationId ?? undefined,
      }),
    // Cada turno consome tokens e atualiza a lista de conversas.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: USAGE_KEY });
      qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

/** Executa o rascunho aprovado e atualiza as listas + histórico. */
export function useAssistantExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      draft: AssistantDraft;
      conversationId?: string | null;
    }) =>
      api.post<AssistantExecuteResult>("/assistant/execute", input.draft, {
        query: { conversationId: input.conversationId ?? undefined },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });
}
