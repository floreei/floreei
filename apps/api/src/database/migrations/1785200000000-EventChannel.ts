import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Separa venda no varejo (balcão/cliente final) de venda no atacado (revenda
 * em pacote fechado). Todo histórico existente vira RETAIL — só a nova tela
 * de Atacado grava WHOLESALE a partir de agora.
 */
export class EventChannel1785200000000 implements MigrationInterface {
  name = "EventChannel1785200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "channel" character varying(10) NOT NULL DEFAULT 'RETAIL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "channel"`);
  }
}
