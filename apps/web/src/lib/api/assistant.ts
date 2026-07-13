import type {
  AiMessage,
  AssistantChatResponse,
  AssistantDraft,
  AssistantExecuteResult,
  AssistantUsageSummary,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const USAGE_KEY = ["assistant", "usage"];

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
    mutationFn: (messages: AiMessage[]) =>
      api.post<AssistantChatResponse>("/assistant/chat", { messages }),
    // Cada turno consome tokens → atualiza o indicador de uso.
    onSettled: () => qc.invalidateQueries({ queryKey: USAGE_KEY }),
  });
}

/** Executa o rascunho aprovado (cria/edita a compra) e atualiza as listas. */
export function useAssistantExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draft: AssistantDraft) =>
      api.post<AssistantExecuteResult>("/assistant/execute", draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
