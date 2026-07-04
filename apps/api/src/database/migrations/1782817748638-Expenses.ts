import { MigrationInterface, QueryRunner } from "typeorm";

export class Expenses1782817748638 implements MigrationInterface {
    name = 'Expenses1782817748638'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "description" character varying(160) NOT NULL, "cost_center" character varying(80) NOT NULL, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "notes" character varying(500), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_85389c627f20798554ac2bfb05" ON "expenses" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "ix_expenses_company_date" ON "expenses" ("company_id", "date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ix_expenses_company_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85389c627f20798554ac2bfb05"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
    }

}
