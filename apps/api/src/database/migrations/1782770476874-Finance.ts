import { MigrationInterface, QueryRunner } from "typeorm";

export class Finance1782770476874 implements MigrationInterface {
    name = 'Finance1782770476874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "direction" character varying(4) NOT NULL, "event_id" uuid, "purchase_id" uuid, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "method" character varying(16) NOT NULL DEFAULT 'PIX', "notes" character varying(500), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4781cf05f36ba314cdd314c0c6" ON "payments" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "ix_payments_company_date" ON "payments" ("company_id", "date") `);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "name" character varying(160) NOT NULL, "city" character varying(120), "contact" character varying(120), "whatsapp" character varying(30), "payment_terms" character varying(160), "notes" text, CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6a9681499416e80c1ffac4fe86" ON "suppliers" ("company_id") `);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "supplier_id" uuid NOT NULL, "date" date NOT NULL, "status" character varying(16) NOT NULL DEFAULT 'RECEIVED', "items_total" numeric(12,2) NOT NULL DEFAULT '0', "freight" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "paid_amount" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c594d713693899d85f454ccdeb" ON "purchases" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "ix_purchases_company_date" ON "purchases" ("company_id", "date") `);
        await queryRunner.query(`CREATE TABLE "purchase_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "purchase_id" uuid NOT NULL, "product_id" uuid, "description" character varying(200) NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit" character varying(16) NOT NULL DEFAULT 'UNIDADE', "unit_price" numeric(12,2) NOT NULL, "line_total" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_e3d9bea880baad86ff6de3290da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_d5fec047f705d5b510c19379b95" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_items" ADD CONSTRAINT "FK_607211d59b13e705a673a999ab5" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_items" ADD CONSTRAINT "FK_43694b2fa800ce38d2da9ce74d6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_items" DROP CONSTRAINT "FK_43694b2fa800ce38d2da9ce74d6"`);
        await queryRunner.query(`ALTER TABLE "purchase_items" DROP CONSTRAINT "FK_607211d59b13e705a673a999ab5"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_d5fec047f705d5b510c19379b95"`);
        await queryRunner.query(`DROP TABLE "purchase_items"`);
        await queryRunner.query(`DROP INDEX "public"."ix_purchases_company_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c594d713693899d85f454ccdeb"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a9681499416e80c1ffac4fe86"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP INDEX "public"."ix_payments_company_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4781cf05f36ba314cdd314c0c6"`);
        await queryRunner.query(`DROP TABLE "payments"`);
    }

}
