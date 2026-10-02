import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Marcação de "cobrada" na venda: quando o saldo foi cobrado do cliente (switch
 * da listagem, "Cobrar no WhatsApp" ou régua automática). Nulo = a cobrar.
 */
export class EventChargedAt1787200000000 implements MigrationInterface {
  name = "EventChargedAt1787200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "charged_at" timestamptz NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "charged_at"`);
  }
}
