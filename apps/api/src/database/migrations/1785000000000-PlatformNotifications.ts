import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Feed de notificações do console do gestor (ex.: novo cadastro). Global — não
 * pertence a tenant; é operacional da plataforma.
 */
export class PlatformNotifications1785000000000 implements MigrationInterface {
  name = "PlatformNotifications1785000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "platform_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "type" character varying(32) NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL DEFAULT '',
        "company_id" uuid,
        "read" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_platform_notifications" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_platform_notifications_created" ON "platform_notifications" ("read", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "ix_platform_notifications_created"`);
    await queryRunner.query(`DROP TABLE "platform_notifications"`);
  }
}
