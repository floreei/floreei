import { MigrationInterface, QueryRunner } from "typeorm";

/** Imagem opcional do produto/insumo (URL no Firebase Storage). */
export class ProductImage1784000000000 implements MigrationInterface {
  name = "ProductImage1784000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "image_url" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "image_url"`);
  }
}
