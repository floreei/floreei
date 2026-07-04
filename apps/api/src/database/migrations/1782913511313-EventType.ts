import { MigrationInterface, QueryRunner } from "typeorm";

export class EventType1782913511313 implements MigrationInterface {
    name = 'EventType1782913511313'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "type" character varying(8) NOT NULL DEFAULT 'EVENT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "type"`);
    }

}
