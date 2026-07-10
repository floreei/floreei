import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Data de entrega da venda (opcional): pode ser passada (pedido antigo já
 * entregue) ou futura (pedido a entregar). A `date` do evento continua sendo a
 * data da venda, que define o período financeiro.
 */
export class EventDeliveryDate1785800000000 implements MigrationInterface {
  name = "EventDeliveryDate1785800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "delivery_date" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "delivery_date"`);
  }
}
