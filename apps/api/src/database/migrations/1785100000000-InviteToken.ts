import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Convite de equipe por link: o membro é criado sem senha/firebaseUid, com um
 * token de convite. Ao aceitar pelo link, ele define a senha (cria o usuário no
 * Firebase) e o token é limpo.
 */
export class InviteToken1785100000000 implements MigrationInterface {
  name = "InviteToken1785100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "invite_token" character varying(64)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_invite_token" ON "users" ("invite_token") WHERE "invite_token" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "uq_users_invite_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invite_token"`);
  }
}
