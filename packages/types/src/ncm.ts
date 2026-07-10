import { z } from "zod";

/**
 * NCM (Nomenclatura Comum do Mercosul) — código fiscal de 8 dígitos exigido
 * em todo item de nota fiscal. Tabela global (não por tenant), sincronizada
 * semanalmente do Portal Único Siscomex e buscada localmente (a API oficial
 * não é de busca — devolve a tabela inteira).
 */
export interface NcmEntry {
  /** 8 dígitos, sem pontuação. */
  code: string;
  /** Descrição da folha (ex.: "Rosas"), sem contexto — pode ser vaga sozinha. */
  description: string;
  /** Descrição com os pais concatenados (ex.: "Flores e botões cortados > Rosas"). */
  hierarchicalDescription: string;
  /** false = saiu da tabela vigente (mantido pra histórico de produtos já vinculados). */
  active: boolean;
  updatedAt: string;
}

/** Sugestão curada (sinônimo do dia a dia → NCM) — controlada manualmente. */
export interface NcmSuggestion {
  id: string;
  /** Termo comum do florista (ex.: "buquê", "vaso"). */
  term: string;
  ncmCode: string;
  /** Rótulo mostrado na lista (geralmente termo + descrição resumida). */
  label: string;
  sortOrder: number;
}

export const ncmSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Informe ao menos 1 caractere").max(60),
});
export type NcmSearchQuery = z.infer<typeof ncmSearchQuerySchema>;

export interface NcmValidation {
  code: string;
  valid: boolean;
  /** Motivo quando inválido (ex.: "Código não encontrado", "Não é uma folha (nível intermediário)"). */
  reason: string | null;
  entry: NcmEntry | null;
}
