import { MigrationInterface, QueryRunner } from "typeorm";

/** Chave Pix do fornecedor — usada para pagar por Pix na tela de pagamento. */
export class SupplierPixKey1786400000000 implements MigrationInterface {
  name = "SupplierPixKey1786400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD COLUMN "pix_key" varchar(140)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "pix_key"`);
  }
}
