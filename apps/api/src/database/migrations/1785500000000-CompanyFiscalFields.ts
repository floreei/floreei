import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Dados fiscais da empresa (necessários pra emitir nota) + NCM por produto.
 * Endereço fiscal é estruturado — diferente do `address` de texto livre
 * (usado no timbrado dos documentos impressos), que não é tocado aqui.
 */
export class CompanyFiscalFields1785500000000 implements MigrationInterface {
  name = "CompanyFiscalFields1785500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies"
        ADD COLUMN "state_registration" character varying(20),
        ADD COLUMN "tax_regime" character varying(20),
        ADD COLUMN "fiscal_address_street" character varying(160),
        ADD COLUMN "fiscal_address_number" character varying(20),
        ADD COLUMN "fiscal_address_complement" character varying(80),
        ADD COLUMN "fiscal_address_neighborhood" character varying(80),
        ADD COLUMN "fiscal_address_city" character varying(80),
        ADD COLUMN "fiscal_address_state" character varying(2),
        ADD COLUMN "fiscal_address_zip" character varying(9),
        ADD COLUMN "fiscal_city_code" character varying(7),
        ADD COLUMN "invoice_auto_emit" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "ncm" character varying(8)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "ncm"`);
    await queryRunner.query(
      `ALTER TABLE "companies"
        DROP COLUMN "invoice_auto_emit",
        DROP COLUMN "fiscal_city_code",
        DROP COLUMN "fiscal_address_zip",
        DROP COLUMN "fiscal_address_state",
        DROP COLUMN "fiscal_address_city",
        DROP COLUMN "fiscal_address_neighborhood",
        DROP COLUMN "fiscal_address_complement",
        DROP COLUMN "fiscal_address_number",
        DROP COLUMN "fiscal_address_street",
        DROP COLUMN "tax_regime",
        DROP COLUMN "state_registration"`,
    );
  }
}
