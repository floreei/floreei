import { MigrationInterface, QueryRunner } from "typeorm";

export class CompanyProfile1782996916384 implements MigrationInterface {
    name = 'CompanyProfile1782996916384'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD "phone" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "email" character varying(180)`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "address" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "logo" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "logo"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "phone"`);
    }

}
