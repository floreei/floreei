import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Histórico do assistente: conversas + mensagens (transcript) e ações
 * executadas (auditoria: o que foi criado/editado).
 */
export class AssistantHistory1786600000000 implements MigrationInterface {
  name = "AssistantHistory1786600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assistant_conversation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "user_id" uuid,
        "title" varchar(160) NOT NULL,
        CONSTRAINT "pk_assistant_conversation" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_assistant_conversation_company_updated" ON "assistant_conversation" ("company_id", "updated_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "assistant_message" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "conversation_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "role" varchar(16) NOT NULL,
        "text" text NOT NULL,
        CONSTRAINT "pk_assistant_message" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_assistant_message_conversation" ON "assistant_message" ("conversation_id", "created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "assistant_action" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "user_id" uuid,
        "conversation_id" uuid,
        "kind" varchar(32) NOT NULL,
        "summary" varchar(300) NOT NULL,
        "href" varchar(200) NOT NULL,
        CONSTRAINT "pk_assistant_action" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_assistant_action_company_created" ON "assistant_action" ("company_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "assistant_action"`);
    await queryRunner.query(`DROP TABLE "assistant_message"`);
    await queryRunner.query(`DROP TABLE "assistant_conversation"`);
  }
}
