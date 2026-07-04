import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentDescription1782951879367 implements MigrationInterface {
    name = 'PaymentDescription1782951879367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "description" character varying(160)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "description"`);
    }

}
