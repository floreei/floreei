import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Custo por unidade de venda de cada item (snapshot na venda). Nulo em itens
 * anteriores — o custo deles continua só no cabeçalho (`events.cost`).
 */
export class EventItemUnitCost1787000000000 implements MigrationInterface {
  name = "EventItemUnitCost1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_items" ADD COLUMN "unit_cost" numeric(12,2) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_items" DROP COLUMN "unit_cost"`);
  }
}
