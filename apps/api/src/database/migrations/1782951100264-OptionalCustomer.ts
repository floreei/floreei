import { MigrationInterface, QueryRunner } from "typeorm";

export class OptionalCustomer1782951100264 implements MigrationInterface {
    name = 'OptionalCustomer1782951100264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_e6eff5dfd412651ce4e354f501c"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "customer_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_e6eff5dfd412651ce4e354f501c" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_e6eff5dfd412651ce4e354f501c"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "customer_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_e6eff5dfd412651ce4e354f501c" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
