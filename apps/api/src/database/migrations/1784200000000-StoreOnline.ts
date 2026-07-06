import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Loja online (storefront): campos de personalização + credenciais de pagamento
 * na empresa, e foto + flag de publicação nos buquês (arrangements).
 */
export class StoreOnline1784200000000 implements MigrationInterface {
  name = "StoreOnline1784200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_slug" character varying(40)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_primary_color" character varying(9) NOT NULL DEFAULT '#2F6050'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_accent_color" character varying(9) NOT NULL DEFAULT '#C6795B'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_headline" character varying(160)`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "mp_access_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "mp_public_key" character varying(200)`,
    );
    // Slug único entre empresas quando definido (índice parcial).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_companies_store_slug" ON "companies" ("store_slug") WHERE "store_slug" IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD COLUMN "image_url" character varying(1000)`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD COLUMN "store_published" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "arrangements" DROP COLUMN "store_published"`,
    );
    await queryRunner.query(`ALTER TABLE "arrangements" DROP COLUMN "image_url"`);
    await queryRunner.query(`DROP INDEX "uq_companies_store_slug"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "mp_public_key"`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "mp_access_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "store_description"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "store_headline"`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "store_accent_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "store_primary_color"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "store_enabled"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "store_slug"`);
  }
}
