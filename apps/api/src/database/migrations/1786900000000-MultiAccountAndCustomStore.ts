import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Login multi-conta: o mesmo e-mail/firebaseUid passa a poder pertencer a várias
 * empresas. A unicidade global de `email`/`firebase_uid` vira unicidade POR
 * EMPRESA. Também adiciona `store_custom` (loja com storefront próprio, ex.:
 * Floravie, que ignora o template de cores).
 */
export class MultiAccountAndCustomStore1786900000000
  implements MigrationInterface
{
  name = "MultiAccountAndCustomStore1786900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_firebase_uid"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_company_email" ON "users" ("company_id", "email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_company_firebase_uid" ON "users" ("company_id", "firebase_uid") WHERE "firebase_uid" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "store_custom" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "store_custom"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_users_company_firebase_uid"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_company_email"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_firebase_uid" ON "users" ("firebase_uid") WHERE "firebase_uid" IS NOT NULL`,
    );
  }
}
