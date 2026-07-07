import { MigrationInterface, QueryRunner } from "typeorm";

/** Chave Pix da empresa — vira QR code de pagamento na nota da venda. */
export class CompanyPix1784900000000 implements MigrationInterface {
  name = "CompanyPix1784900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "pix_key" character varying(140)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "pix_key"`);
  }
}
