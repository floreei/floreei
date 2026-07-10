import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { NcmEntry, NcmSuggestion, NcmValidation } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { NcmSuggestionEntity } from "../infrastructure/ncm-suggestion.entity";
import { NcmEntity } from "../infrastructure/ncm.entity";
import { NcmRepository } from "../infrastructure/ncm.repository";

function toEntry(e: NcmEntity): NcmEntry {
  return {
    code: e.code,
    description: e.description,
    hierarchicalDescription: e.hierarchicalDescription,
    active: e.active,
    updatedAt: e.updatedAt.toISOString(),
  };
}

@Injectable()
export class NcmService {
  constructor(
    private readonly repo: NcmRepository,
    @InjectRepository(NcmSuggestionEntity)
    private readonly suggestions: Repository<NcmSuggestionEntity>,
  ) {}

  async search(term: string): Promise<NcmEntry[]> {
    const entries = await this.repo.search(term);
    return entries.map(toEntry);
  }

  /** Lista curada de sinônimos de floricultura, mostrada quando a busca está vazia. */
  async listSuggestions(): Promise<NcmSuggestion[]> {
    const rows = await this.suggestions.find({ order: { sortOrder: "ASC" } });
    return rows.map((s) => ({
      id: s.id,
      term: s.term,
      ncmCode: s.ncmCode,
      label: s.label,
      sortOrder: s.sortOrder,
    }));
  }

  /**
   * Validação usada no cadastro de produto: existe, é folha (8 dígitos —
   * único nível que a tabela armazena) e está vigente.
   */
  async validate(code: string): Promise<NcmValidation> {
    if (!/^\d{8}$/.test(code)) {
      return { code, valid: false, reason: "Código deve ter 8 dígitos.", entry: null };
    }
    const entity = await this.repo.findByCode(code);
    if (!entity) {
      return { code, valid: false, reason: "Código não encontrado.", entry: null };
    }
    if (!entity.active) {
      return {
        code,
        valid: false,
        reason: "Código não está mais vigente.",
        entry: toEntry(entity),
      };
    }
    return { code, valid: true, reason: null, entry: toEntry(entity) };
  }
}
