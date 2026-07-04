import { MigrationInterface, QueryRunner } from "typeorm";

export class Stock1782786015596 implements MigrationInterface {
    name = 'Stock1782786015596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "product_id" uuid NOT NULL, "type" character varying(12) NOT NULL, "source" character varying(12) NOT NULL DEFAULT 'MANUAL', "quantity" numeric(12,3) NOT NULL, "lot" character varying(60), "expires_at" date, "source_id" uuid, "date" date NOT NULL, "notes" character varying(500), CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5c64f92a726ebd11df7f4a45ae" ON "stock_movements" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "ix_stock_company_product" ON "stock_movements" ("company_id", "product_id") `);
        await queryRunner.query(`ALTER TABLE "products" ADD "min_stock" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "min_stock"`);
        await queryRunner.query(`DROP INDEX "public"."ix_stock_company_product"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c64f92a726ebd11df7f4a45ae"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
    }

}
