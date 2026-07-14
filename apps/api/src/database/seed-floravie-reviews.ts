import "reflect-metadata";
import { CompanyEntity } from "../modules/companies/infrastructure/company.entity";
import dataSource from "./data-source";
import { seedFloravieReviews } from "./floravie-catalog";

/**
 * Semeia avaliações (APROVADas) nos buquês da Floravie, pra o rating não ficar
 * zerado na vitrine. Idempotente — só semeia num buquê sem avaliação `SEED`.
 * Requer que a empresa e o catálogo já existam (`connect:floravie` +
 * `register:floravie`).
 *
 * Uso: `pnpm --filter @sistema-flores/api seed:floravie-reviews`
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

  const created = await seedFloravieReviews(dataSource, company.id);
  // eslint-disable-next-line no-console
  console.log(`Avaliações semeadas na Floravie: ${created} novas.`);

  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao semear avaliações da Floravie:", error);
  process.exit(1);
});
