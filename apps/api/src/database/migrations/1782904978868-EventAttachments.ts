import { MigrationInterface, QueryRunner } from "typeorm";

export class EventAttachments1782904978868 implements MigrationInterface {
    name = 'EventAttachments1782904978868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "company_id" uuid NOT NULL, "event_id" uuid NOT NULL, "label" character varying(120) NOT NULL, "url" character varying(500) NOT NULL, CONSTRAINT "PK_f2a028c045f63ca9678e3f7c2b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_acc734bb1aee0e6379a79c4889" ON "event_attachments" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "ix_event_attachments_event" ON "event_attachments" ("event_id") `);
        await queryRunner.query(`ALTER TABLE "event_attachments" ADD CONSTRAINT "FK_a38dd24b18e266bb85053017945" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_attachments" DROP CONSTRAINT "FK_a38dd24b18e266bb85053017945"`);
        await queryRunner.query(`DROP INDEX "public"."ix_event_attachments_event"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_acc734bb1aee0e6379a79c4889"`);
        await queryRunner.query(`DROP TABLE "event_attachments"`);
    }

}
