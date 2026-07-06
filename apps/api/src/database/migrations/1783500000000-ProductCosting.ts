import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fase 2 — M1: insumo com unidade de compra (embalagem), conteúdo do pacote e
 * custo por unidade-base (última compra). Compat: produtos existentes ficam como
 * revenda 1:1 (purchase_unit = unit, pack_size = 1, custo = preço de compra).
 */
export class ProductCosting1783500000000 implements MigrationInterface {
  name = "ProductCosting1783500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "purchase_unit" character varying(16) NOT NULL DEFAULT 'UNIDADE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "pack_size" numeric(12,3) NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "current_unit_cost" numeric(12,2) NOT NULL DEFAULT 0`,
    );
    // Backfill de compat: mantém a revenda 1:1 idêntica.
    await queryRunner.query(
      `UPDATE "products" SET "purchase_unit" = "unit", "current_unit_cost" = "default_purchase_price"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "current_unit_cost"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "pack_size"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "purchase_unit"`);
  }
}
