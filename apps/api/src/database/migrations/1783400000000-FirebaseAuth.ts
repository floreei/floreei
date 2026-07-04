import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migração para Firebase Auth: identidade/credenciais passam a viver no Firebase.
 * - Adiciona `firebase_uid` (único quando presente) para casar o usuário local
 *   com a conta do Firebase.
 * - Remove `password_hash` (as senhas agora ficam no Firebase, não no nosso banco).
 */
export class FirebaseAuth1783400000000 implements MigrationInterface {
  name = "FirebaseAuth1783400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "firebase_uid" character varying(128)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_firebase_uid" ON "users" ("firebase_uid") WHERE "firebase_uid" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "password_hash" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_users_firebase_uid"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firebase_uid"`);
  }
}
