import "reflect-metadata";
import { CompanyEntity } from "../modules/companies/infrastructure/company.entity";
import dataSource from "./data-source";
import { registerFloravieCatalog } from "./floravie-catalog";

/**
 * Registra os buquês do catálogo da Floravie (espelho do mock) como arranjos
 * publicados da loja. Idempotente — pode rodar quantas vezes quiser (atualiza os
 * existentes por nome). Requer que a empresa Floravie já exista (rode
 * `connect:floravie` antes).
 *
 * Uso: `pnpm --filter @sistema-flores/api register:floravie`
 */
const SLUG = process.env.FLORAVIE_STORE_SLUG ?? "floravie";

async function run(): Promise<void> {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const company = await dataSource
    .getRepository(CompanyEntity)
    .findOne({ where: { storeSlug: SLUG } });
  if (!company) {
    throw new Error(
      `Empresa da loja "${SLUG}" não encontrada. Rode "connect:floravie" primeiro.`,
    );
  }

  const arrangements = await registerFloravieCatalog(dataSource, company.id);
  // eslint-disable-next-line no-console
  console.log(
    `Catálogo da Floravie registrado: ${arrangements.length} buquês publicados.`,
  );

  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao registrar o catálogo da Floravie:", error);
  process.exit(1);
});
