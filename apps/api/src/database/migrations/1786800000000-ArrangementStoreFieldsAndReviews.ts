import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Campos de vitrine no buquê (descrição, selo, categoria de loja e variações de
 * tamanho) + tabela de avaliações da loja online (`arrangement_reviews`). FK
 * CASCADE: excluir o buquê remove as avaliações.
 */
export class ArrangementStoreFieldsAndReviews1786800000000
  implements MigrationInterface
{
  name = "ArrangementStoreFieldsAndReviews1786800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "arrangements"
        ADD COLUMN "description" text,
        ADD COLUMN "badge" character varying(40),
        ADD COLUMN "store_category" character varying(40),
        ADD COLUMN "store_sizes" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `CREATE TABLE "arrangement_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "company_id" uuid NOT NULL,
        "arrangement_id" uuid NOT NULL,
        "author_name" character varying(80) NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "status" character varying(10) NOT NULL DEFAULT 'APPROVED',
        "source" character varying(10) NOT NULL DEFAULT 'CUSTOMER',
        CONSTRAINT "PK_arrangement_reviews" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_company_id" ON "arrangement_reviews" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ix_reviews_company_arrangement" ON "arrangement_reviews" ("company_id", "arrangement_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "arrangement_reviews" ADD CONSTRAINT "FK_reviews_arrangement" FOREIGN KEY ("arrangement_id") REFERENCES "arrangements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "arrangement_reviews" DROP CONSTRAINT "FK_reviews_arrangement"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."ix_reviews_company_arrangement"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reviews_company_id"`);
    await queryRunner.query(`DROP TABLE "arrangement_reviews"`);
    await queryRunner.query(
      `ALTER TABLE "arrangements"
        DROP COLUMN "store_sizes",
        DROP COLUMN "store_category",
        DROP COLUMN "badge",
        DROP COLUMN "description"`,
    );
  }
}
