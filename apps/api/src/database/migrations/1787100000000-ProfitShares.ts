import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Sociedade: lucro dividido entre N pessoas. N no produto (padrão), snapshot
 * por linha da venda, parte dos sócios no cabeçalho; compra em sociedade
 * guarda a nota cheia e passa `total` a ser a parte do usuário.
 */
export class ProfitShares1787100000000 implements MigrationInterface {
  name = "ProfitShares1787100000000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "products" ADD COLUMN "profit_shares" integer NOT NULL DEFAULT 1`);
    await q.query(`ALTER TABLE "event_items" ADD COLUMN "profit_shares" integer NOT NULL DEFAULT 1`);
    await q.query(`ALTER TABLE "events" ADD COLUMN "partners_share" numeric(12,2) NOT NULL DEFAULT 0`);
    await q.query(`ALTER TABLE "purchases" ADD COLUMN "profit_shares" integer NOT NULL DEFAULT 1`);
    await q.query(`ALTER TABLE "purchases" ADD COLUMN "gross_total" numeric(12,2) NOT NULL DEFAULT 0`);
    await q.query(`UPDATE "purchases" SET "gross_total" = "total"`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "purchases" DROP COLUMN "gross_total"`);
    await q.query(`ALTER TABLE "purchases" DROP COLUMN "profit_shares"`);
    await q.query(`ALTER TABLE "events" DROP COLUMN "partners_share"`);
    await q.query(`ALTER TABLE "event_items" DROP COLUMN "profit_shares"`);
    await q.query(`ALTER TABLE "products" DROP COLUMN "profit_shares"`);
  }
}
