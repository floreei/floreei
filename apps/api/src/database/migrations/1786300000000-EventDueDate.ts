import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Vencimento do saldo a receber da venda (venda a prazo) — referência da régua
 * de cobrança e do envio manual.
 */
export class EventDueDate1786300000000 implements MigrationInterface {
  name = "EventDueDate1786300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD COLUMN "due_date" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "due_date"`);
  }
}
