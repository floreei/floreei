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

/**
 * Limpa só os dados de negócio, **preservando `companies` e `users`**. Assim cada
 * suíte pode cadastrar a empresa/admin uma única vez (beforeAll) e reaproveitar o
 * token entre os testes — reduz drasticamente os cadastros no Firebase real (rate
 * limit). Descobre as tabelas dinamicamente para não desatualizar com o schema.
 */
export async function truncateBusiness(dataSource: DataSource): Promise<void> {
  const keep = new Set([
    "companies",
    "users",
    "migrations",
    "typeorm_metadata",
  ]);
  const rows: { tablename: string }[] = await dataSource.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const tables = rows.map((r) => r.tablename).filter((t) => !keep.has(t));
  if (tables.length === 0) return;
  await dataSource.query(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
}
