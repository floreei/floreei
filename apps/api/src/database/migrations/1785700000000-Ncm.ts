import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Tabela de NCM (Nomenclatura Comum do Mercosul) — dado global, sincronizado
 * semanalmente do Portal Único Siscomex (ver NcmSyncService), buscado
 * localmente com unaccent + pg_trgm (tolerante a acento/erro de digitação).
 * `ncm_suggestions` é a lista curada de sinônimos de floricultura, mantida
 * manualmente — sem FK pra `ncm.code` de propósito (pode referenciar um
 * código antes da primeira sincronização rodar).
 */
export class Ncm1785700000000 implements MigrationInterface {
  name = "Ncm1785700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    await queryRunner.query(
      `CREATE TABLE "ncm" (
        "code" character varying(8) NOT NULL,
        "description" text NOT NULL,
        "hierarchical_description" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ncm" PRIMARY KEY ("code")
      )`,
    );
    // unaccent() não é IMMUTABLE por padrão (depende do dicionário de busca
    // text search, que pode mudar) — para indexar precisamos de um wrapper
    // marcado IMMUTABLE, prática padrão do Postgres para esse caso.
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION "immutable_unaccent"(text) RETURNS text AS
        $$ SELECT unaccent('unaccent', $1) $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_ncm_search" ON "ncm" USING GIN (immutable_unaccent("hierarchical_description") gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE TABLE "ncm_suggestions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "term" character varying(80) NOT NULL,
        "ncm_code" character varying(8) NOT NULL,
        "label" character varying(160) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_ncm_suggestions" PRIMARY KEY ("id")
      )`,
    );

    // Ponto de partida — heading 0603 (flores e botões cortados) é uma
    // classificação NCM/HS estável há décadas; os códigos de 8 dígitos abaixo
    // são o mais comum do dia a dia de floricultura. Revisar com o contador
    // e ajustar pelo painel assim que a primeira sincronização confirmar os
    // códigos vigentes — isto é um PONTO DE PARTIDA, não aconselhamento fiscal.
    await queryRunner.query(
      `INSERT INTO "ncm_suggestions" ("term", "ncm_code", "label") VALUES
        ('rosa', '06031100', 'Rosas — flores frescas cortadas'),
        ('flor', '06031900', 'Outras flores frescas cortadas'),
        ('buquê', '06031900', 'Buquê de flores frescas cortadas'),
        ('planta', '06029090', 'Outras plantas vivas'),
        ('vaso de flor', '06024090', 'Plantas em vaso — outras'),
        ('folhagem', '06049000', 'Folhagens e ramos ornamentais'),
        ('fita', '58063200', 'Fitas de fibras sintéticas'),
        ('papel de embrulho', '48239099', 'Papel para embalagem/decoração'),
        ('urso de pelúcia', '95030010', 'Bonecos de pelúcia (brinquedo)'),
        ('chocolate', '18063100', 'Chocolate recheado, em embalagem imediata')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ncm_suggestions"`);
    await queryRunner.query(`DROP INDEX "public"."ix_ncm_search"`);
    await queryRunner.query(`DROP FUNCTION "immutable_unaccent"(text)`);
    await queryRunner.query(`DROP TABLE "ncm"`);
  }
}
