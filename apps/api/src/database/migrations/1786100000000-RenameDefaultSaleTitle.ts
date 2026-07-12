import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * O título padrão da venda rápida deixou de ser "Venda de balcão" e virou
 * "Venda direta" (varejo) / "Venda no atacado" (atacado). Renomeia as vendas
 * antigas que ficaram com o título padrão antigo.
 */
export class RenameDefaultSaleTitle1786100000000 implements MigrationInterface {
  name = "RenameDefaultSaleTitle1786100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "events"
         SET "title" = CASE WHEN "channel" = 'WHOLESALE'
           THEN 'Venda no atacado' ELSE 'Venda direta' END
       WHERE "title" = 'Venda de balcão'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "events" SET "title" = 'Venda de balcão'
       WHERE "title" IN ('Venda direta', 'Venda no atacado')`,
    );
  }
}
