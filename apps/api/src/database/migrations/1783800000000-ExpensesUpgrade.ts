import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Despesas 2.0: vencimento (rename de `date`), pago/data/método, recorrência e
 * anexos (conta/comprovante). Compat: despesas existentes viram PAGAS na própria
 * data de vencimento — preserva o comportamento atual no Caixa.
 */
export class ExpensesUpgrade1783800000000 implements MigrationInterface {
  name = "ExpensesUpgrade1783800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."ix_expenses_company_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" RENAME COLUMN "date" TO "due_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD COLUMN "paid" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD COLUMN "paid_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD COLUMN "payment_method" character varying(16)`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD COLUMN "recurring" boolean NOT NULL DEFAULT false`,
    );
    // Compat: existentes = pagas no vencimento (mantêm o caixa igual).
    await queryRunner.query(
      `UPDATE "expenses" SET "paid" = true, "paid_date" = "due_date"`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_expenses_company_due" ON "expenses" ("company_id", "due_date")`,
    );

    await queryRunner.query(
      `CREATE TABLE "expense_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "expense_id" uuid NOT NULL, "label" character varying(160) NOT NULL, "url" character varying(1000) NOT NULL, "kind" character varying(12) NOT NULL, "content_type" character varying(100), CONSTRAINT "PK_expense_attachments" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_expense_attachments_expense" ON "expense_attachments" ("expense_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_attachments" ADD CONSTRAINT "FK_expense_attachments_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_attachments" ADD CONSTRAINT "FK_expense_attachments_expense" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "expense_attachments"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."ix_expenses_company_due"`,
    );
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "recurring"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "payment_method"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "paid_date"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "paid"`);
    await queryRunner.query(
      `ALTER TABLE "expenses" RENAME COLUMN "due_date" TO "date"`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_expenses_company_date" ON "expenses" ("company_id", "date")`,
    );
  }
}
