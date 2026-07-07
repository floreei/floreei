import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Guarda o link de checkout do preapproval para retomar um pagamento não
 * concluído ("continuar pagamento" na página de plano / tela de bloqueio).
 */
export class SubscriptionInitPoint1784700000000 implements MigrationInterface {
  name = "SubscriptionInitPoint1784700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN "mp_init_point" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "mp_init_point"`,
    );
  }
}
