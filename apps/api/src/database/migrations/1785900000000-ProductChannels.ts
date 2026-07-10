import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Flags de canal do insumo: onde ele pode ser vendido — venda direta (avulso
 * ao consumidor) e/ou atacado (revenda em pacote). Backfill preserva o
 * comportamento atual: atacado ligado para insumos com preço de venda; venda
 * direta desligada (antes, só buquês apareciam na venda direta).
 */
export class ProductChannels1785900000000 implements MigrationInterface {
  name = "ProductChannels1785900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "show_in_retail" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "show_in_wholesale" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "show_in_wholesale" = ("default_sale_price" > 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "show_in_wholesale"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "show_in_retail"`,
    );
  }
}
