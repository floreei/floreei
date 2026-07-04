import { DataSource } from "typeorm";
import { buildDataSourceOptions } from "../../src/database/typeorm.config";

/**
 * Cria e inicializa um DataSource apontando para o banco de TESTE, rodando as
 * migrations. Use em testes de integração; lembre de `destroy()` ao final.
 */
export async function initTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource(buildDataSourceOptions(true));
  await dataSource.initialize();
  await dataSource.runMigrations();
  return dataSource;
}

/** Limpa todas as tabelas de domínio entre testes, respeitando as FKs. */
export async function truncateAll(dataSource: DataSource): Promise<void> {
  const tables = [
    "quote_items",
    "quotes",
    "events",
    "products",
    "categories",
    "customers",
    "users",
    "companies",
  ];
  await dataSource.query(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}
