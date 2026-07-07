import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Vaga de fundador (10 no total): consumida automaticamente na 1ª assinatura
 * autorizada ou marcada pelo gestor (fechamento por WhatsApp). Permanente —
 * cancelar a assinatura não devolve a vaga.
 */
export class Founders1784800000000 implements MigrationInterface {
  name = "Founders1784800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "founder" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "founder"`);
  }
}
