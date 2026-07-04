import { join } from "node:path";
import type { DataSourceOptions } from "typeorm";
import { entities } from "./entities";

/**
 * Monta as opções de conexão do TypeORM a partir das variáveis de ambiente.
 * Quando `useTestDb` é true (ou NODE_ENV=test) usa as variáveis TEST_DATABASE_*.
 */
export function buildDataSourceOptions(
  useTestDb = process.env.NODE_ENV === "test",
): DataSourceOptions {
  const prefix = useTestDb ? "TEST_DATABASE" : "DATABASE";
  const get = (key: string, fallback: string) =>
    process.env[`${prefix}_${key}`] ?? fallback;

  return {
    type: "postgres",
    host: get("HOST", "localhost"),
    port: Number(get("PORT", useTestDb ? "5433" : "5440")),
    username: get("USER", "flores"),
    password: get("PASSWORD", "flores"),
    database: get("NAME", useTestDb ? "sistema_flores_test" : "sistema_flores"),
    entities,
    migrations: [join(__dirname, "migrations", "*.{ts,js}")],
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === "true",
  };
}
