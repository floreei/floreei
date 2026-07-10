import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NcmEntity } from "./ncm.entity";

const ONLY_DIGITS = /^\d+$/;

@Injectable()
export class NcmRepository {
  constructor(
    @InjectRepository(NcmEntity) private readonly repo: Repository<NcmEntity>,
  ) {}

  findByCode(code: string): Promise<NcmEntity | null> {
    return this.repo.findOne({ where: { code } });
  }

  /**
   * Termo só com números → prefixo do código (o florista sabe o código de
   * cabeça ou colou de algum lugar). Texto → similaridade tolerante a
   * acento/erro de digitação (unaccent + pg_trgm), pela descrição hierárquica
   * (a folha sozinha costuma ser vaga — "Rosas" sem o contexto do pai).
   */
  async search(term: string, limit = 15): Promise<NcmEntity[]> {
    if (ONLY_DIGITS.test(term)) {
      return this.repo
        .createQueryBuilder("ncm")
        .where("ncm.active = true")
        .andWhere("ncm.code LIKE :prefix", { prefix: `${term}%` })
        .orderBy("ncm.code", "ASC")
        .limit(limit)
        .getMany();
    }
    // similarity()/"%" comparam a string INTEIRA — ruim aqui, porque a
    // descrição hierárquica é longa e o termo buscado é curto ("rosas" contra
    // um texto de 150 caracteres dá similaridade baixa mesmo casando bem).
    // word_similarity()/"<%" acha o melhor trecho (por palavra) dentro do
    // texto, exatamente o caso de uso de busca — e o mesmo índice GIN
    // (gin_trgm_ops) cobre os dois operadores.
    return this.repo
      .createQueryBuilder("ncm")
      .where("ncm.active = true")
      .andWhere(
        "immutable_unaccent(:term) <% immutable_unaccent(ncm.hierarchical_description)",
        { term },
      )
      .orderBy(
        "word_similarity(immutable_unaccent(:term), immutable_unaccent(ncm.hierarchical_description))",
        "DESC",
      )
      .setParameter("term", term)
      .limit(limit)
      .getMany();
  }

  /** Upsert em lote (sincronização) — atualiza se o código já existe. */
  async upsertMany(
    entries: Pick<NcmEntity, "code" | "description" | "hierarchicalDescription">[],
  ): Promise<void> {
    if (entries.length === 0) return;
    const now = new Date();
    await this.repo.upsert(
      entries.map((e) => ({ ...e, active: true, updatedAt: now })),
      ["code"],
    );
  }

  /** Marca como inativo tudo que NÃO estiver na lista de códigos vigentes. */
  async deactivateMissing(currentCodes: string[]): Promise<void> {
    if (currentCodes.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .update(NcmEntity)
      .set({ active: false, updatedAt: new Date() })
      .where("code NOT IN (:...codes)", { codes: currentCodes })
      .andWhere("active = true")
      .execute();
  }

  count(): Promise<number> {
    return this.repo.count();
  }
}
