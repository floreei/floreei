import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fase 2 — M3: a venda pode conter buquês (arrangement_id no item) e persiste o
 * COGS (events.cost). Compat: cost = sold_value − estimated_profit dos eventos
 * existentes (a revenda mantém o mesmo lucro).
 */
export class EventCogs1783700000000 implements MigrationInterface {
  name = "EventCogs1783700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_items" ADD COLUMN "arrangement_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_items" ADD CONSTRAINT "FK_event_items_arrangement" FOREIGN KEY ("arrangement_id") REFERENCES "arrangements"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "cost" numeric(12,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE "events" SET "cost" = ROUND("sold_value" - COALESCE("estimated_profit", 0), 2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "cost"`);
    await queryRunner.query(
      `ALTER TABLE "event_items" DROP CONSTRAINT "FK_event_items_arrangement"`,
    );
    await queryRunner.query(`ALTER TABLE "event_items" DROP COLUMN "arrangement_id"`);
  }
}
