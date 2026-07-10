import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * O modo MARGIN_PCT do buquê passa a ser **markup sobre o custo** (100% dobra o
 * custo) em vez de margem sobre a venda. Para não mudar o preço dos buquês já
 * cadastrados, convertemos `profit_pct` de margem→markup:
 *   markup% = margem% / (1 − margem%/100)   (ex.: 50 → 100)
 * A coluna é alargada de numeric(5,2) para numeric(12,2) porque o markup pode
 * ultrapassar 999,99% (o app agora aceita markup alto).
 */
export class ArrangementMarkup1786000000000 implements MigrationInterface {
  name = "ArrangementMarkup1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "arrangements" ALTER COLUMN "profit_pct" TYPE numeric(12,2)`,
    );
    // margem→markup preservando o preço; guarda contra divisão por zero/negativa.
    await queryRunner.query(
      `UPDATE "arrangements"
         SET "profit_pct" = ROUND("profit_pct" / (1 - "profit_pct" / 100), 2)
       WHERE "pricing_mode" = 'MARGIN_PCT'
         AND "profit_pct" > 0
         AND "profit_pct" < 100`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // markup→margem (inverso), depois estreita a coluna de volta.
    await queryRunner.query(
      `UPDATE "arrangements"
         SET "profit_pct" = ROUND("profit_pct" / (1 + "profit_pct" / 100), 2)
       WHERE "pricing_mode" = 'MARGIN_PCT'
         AND "profit_pct" > 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" ALTER COLUMN "profit_pct" TYPE numeric(5,2)`,
    );
  }
}
