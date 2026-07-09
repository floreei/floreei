import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Separa cliente de venda direta (varejo) de cliente de atacado — mesmo
 * canal já usado em `events.channel`. Todo cliente existente vira RETAIL;
 * o florista marca os de atacado manualmente ao editá-los.
 */
export class CustomerChannel1785300000000 implements MigrationInterface {
  name = "CustomerChannel1785300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" ADD COLUMN "channel" character varying(10) NOT NULL DEFAULT 'RETAIL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "channel"`);
  }
}
