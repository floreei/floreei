import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Padrões fiscais no nível da empresa (ambiente, natureza da operação, CFOP,
 * CSOSN/CST, origem) — aplicados a todas as notas, o gateway calcula o imposto —
 * e endereço fiscal ESTRUTURADO do cliente (destinatário da NF-e; a NFC-e
 * dispensa). O `address` de texto livre do cliente não é tocado.
 */
export class FiscalDefaultsAndCustomerAddress1786700000000
  implements MigrationInterface
{
  name = "FiscalDefaultsAndCustomerAddress1786700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies"
        ADD COLUMN "fiscal_environment" character varying(12) NOT NULL DEFAULT 'HOMOLOGACAO',
        ADD COLUMN "fiscal_nature" character varying(60),
        ADD COLUMN "fiscal_cfop_in_state" character varying(4),
        ADD COLUMN "fiscal_cfop_out_state" character varying(4),
        ADD COLUMN "fiscal_icms_csosn" character varying(4),
        ADD COLUMN "fiscal_icms_cst" character varying(3),
        ADD COLUMN "fiscal_origin" character varying(1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers"
        ADD COLUMN "state_registration" character varying(20),
        ADD COLUMN "address_street" character varying(160),
        ADD COLUMN "address_number" character varying(20),
        ADD COLUMN "address_complement" character varying(80),
        ADD COLUMN "address_neighborhood" character varying(80),
        ADD COLUMN "address_city" character varying(80),
        ADD COLUMN "address_state" character varying(2),
        ADD COLUMN "address_zip" character varying(9),
        ADD COLUMN "city_code" character varying(7)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers"
        DROP COLUMN "city_code",
        DROP COLUMN "address_zip",
        DROP COLUMN "address_state",
        DROP COLUMN "address_city",
        DROP COLUMN "address_neighborhood",
        DROP COLUMN "address_complement",
        DROP COLUMN "address_number",
        DROP COLUMN "address_street",
        DROP COLUMN "state_registration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies"
        DROP COLUMN "fiscal_origin",
        DROP COLUMN "fiscal_icms_cst",
        DROP COLUMN "fiscal_icms_csosn",
        DROP COLUMN "fiscal_cfop_out_state",
        DROP COLUMN "fiscal_cfop_in_state",
        DROP COLUMN "fiscal_nature",
        DROP COLUMN "fiscal_environment"`,
    );
  }
}
