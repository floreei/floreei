import type {
  AiMessage,
  AssistantChatResponse,
  AssistantDraft,
  AssistantExecuteResult,
} from "@sistema-flores/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

/** Um turno da conversa com o assistente. */
export function useAssistantChat() {
  return useMutation({
    mutationFn: (messages: AiMessage[]) =>
      api.post<AssistantChatResponse>("/assistant/chat", { messages }),
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
