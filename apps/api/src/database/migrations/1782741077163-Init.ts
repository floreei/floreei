import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1782741077163 implements MigrationInterface {
    name = 'Init1782741077163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "category_id" uuid NOT NULL, "name" character varying(160) NOT NULL, "unit" character varying(16) NOT NULL DEFAULT 'UNIDADE', "default_purchase_price" numeric(12,2) NOT NULL DEFAULT '0', "default_sale_price" numeric(12,2) NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b417f1726f6ccafb18730adffb" ON "products" ("company_id") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "name" character varying(120) NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_987f987126a3f2e4f9ec03db04" ON "categories" ("company_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_categories_company_name" ON "categories" ("company_id", "name") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "name" character varying(160) NOT NULL, "email" character varying(180) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" character varying(16) NOT NULL DEFAULT 'OPERATOR', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ae6334059289559722437bcc1" ON "users" ("company_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(160) NOT NULL, "document" character varying(20), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "name" character varying(160) NOT NULL, "phone" character varying(30), "whatsapp" character varying(30), "email" character varying(180), "document" character varying(20), "address" character varying(255), "notes" text, CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f0e29920aaf871f3eddbea69f0" ON "customers" ("company_id") `);
        await queryRunner.query(`CREATE TABLE "quote_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "quote_id" uuid NOT NULL, "product_id" uuid, "description" character varying(200) NOT NULL, "quantity" numeric(12,3) NOT NULL, "unit" character varying(16) NOT NULL DEFAULT 'UNIDADE', "purchase_price" numeric(12,2) NOT NULL, "sale_price" numeric(12,2) NOT NULL, "line_cost" numeric(12,2) NOT NULL DEFAULT '0', "line_sale" numeric(12,2) NOT NULL DEFAULT '0', "line_profit" numeric(12,2) NOT NULL DEFAULT '0', "margin_pct" numeric(6,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_135ad3f02b5abcf65fb5cb20ad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "number" integer NOT NULL, "customer_id" uuid NOT NULL, "event_id" uuid, "created_by_id" uuid, "status" character varying(16) NOT NULL DEFAULT 'DRAFT', "valid_until" date, "notes" text, "total_cost" numeric(12,2) NOT NULL DEFAULT '0', "total_sale" numeric(12,2) NOT NULL DEFAULT '0', "total_profit" numeric(12,2) NOT NULL DEFAULT '0', "margin_pct" numeric(6,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2eaf15faa1ace636a6e999bec8" ON "quotes" ("company_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_quotes_company_number" ON "quotes" ("company_id", "number") `);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "title" character varying(180) NOT NULL, "customer_id" uuid NOT NULL, "quote_id" uuid, "responsible_user_id" uuid, "date" date NOT NULL, "location" character varying(255), "status" character varying(16) NOT NULL DEFAULT 'CONFIRMED', "sold_value" numeric(12,2) NOT NULL DEFAULT '0', "received_value" numeric(12,2) NOT NULL DEFAULT '0', "estimated_profit" numeric(12,2) NOT NULL DEFAULT '0', "real_profit" numeric(12,2), "notes" text, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b97c36be0cf65565fad88588c2" ON "events" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "ix_events_company_status_date" ON "events" ("company_id", "status", "date") `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_items" ADD CONSTRAINT "FK_c11d594b8cf436caaee20122fd8" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_items" ADD CONSTRAINT "FK_d7d549103d96596ae10c47dca40" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_a11bdb4a739328d1009c0b47e83" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_a3157228a807d95fbe8ac041712" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quotes" ADD CONSTRAINT "FK_79c195fa1cce1264c8f51a6747f" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_e6eff5dfd412651ce4e354f501c" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_5852a56ab93f6942743d77b4c08" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_5852a56ab93f6942743d77b4c08"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_e6eff5dfd412651ce4e354f501c"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_79c195fa1cce1264c8f51a6747f"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_a3157228a807d95fbe8ac041712"`);
        await queryRunner.query(`ALTER TABLE "quotes" DROP CONSTRAINT "FK_a11bdb4a739328d1009c0b47e83"`);
        await queryRunner.query(`ALTER TABLE "quote_items" DROP CONSTRAINT "FK_d7d549103d96596ae10c47dca40"`);
        await queryRunner.query(`ALTER TABLE "quote_items" DROP CONSTRAINT "FK_c11d594b8cf436caaee20122fd8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`DROP INDEX "public"."ix_events_company_status_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b97c36be0cf65565fad88588c2"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP INDEX "public"."uq_quotes_company_number"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2eaf15faa1ace636a6e999bec8"`);
        await queryRunner.query(`DROP TABLE "quotes"`);
        await queryRunner.query(`DROP TABLE "quote_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0e29920aaf871f3eddbea69f0"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ae6334059289559722437bcc1"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."uq_categories_company_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_987f987126a3f2e4f9ec03db04"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b417f1726f6ccafb18730adffb"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
