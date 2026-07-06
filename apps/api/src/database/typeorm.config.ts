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
    // TLS para Postgres gerenciado (Neon exige; RDS opcional). Ligue com
    // DATABASE_SSL=true. Verifica o certificado do servidor por padrão (Neon usa
    // CA público confiável). Se o provedor usar um CA fora do bundle do Node
    // (ex.: RDS sem o CA), relaxe com DATABASE_SSL_NO_VERIFY=true.
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== "true" }
        : false,
    entities,
    migrations: [join(__dirname, "migrations", "*.{ts,js}")],
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === "true",
  };
}
