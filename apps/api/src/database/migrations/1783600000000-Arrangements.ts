import { MigrationInterface, QueryRunner } from "typeorm";

/** Fase 2 — M2: buquês/arranjos (produto composto) com ficha técnica. */
export class Arrangements1783600000000 implements MigrationInterface {
  name = "Arrangements1783600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "arrangements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "category_id" uuid, "name" character varying(160) NOT NULL, "sale_price" numeric(12,2) NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_arrangements" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_arrangements_company" ON "arrangements" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "arrangement_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "arrangement_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(12,3) NOT NULL, CONSTRAINT "PK_arrangement_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_arrangement_items_arrangement" ON "arrangement_items" ("arrangement_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD CONSTRAINT "FK_arrangements_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" ADD CONSTRAINT "FK_arrangements_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangement_items" ADD CONSTRAINT "FK_arrangement_items_arrangement" FOREIGN KEY ("arrangement_id") REFERENCES "arrangements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangement_items" ADD CONSTRAINT "FK_arrangement_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "arrangement_items" DROP CONSTRAINT "FK_arrangement_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangement_items" DROP CONSTRAINT "FK_arrangement_items_arrangement"`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" DROP CONSTRAINT "FK_arrangements_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangements" DROP CONSTRAINT "FK_arrangements_company"`,
    );
    await queryRunner.query(`DROP TABLE "arrangement_items"`);
    await queryRunner.query(`DROP TABLE "arrangements"`);
  }
}
