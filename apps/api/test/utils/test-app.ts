import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { deleteTrackedUsers } from "./auth-helper";
import { truncateAll, truncateBusiness } from "./test-database";

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
  /** Limpa tudo, inclusive `companies`/`users` (exige novo cadastro). */
  reset: () => Promise<void>;
  /** Limpa só dados de negócio, preservando empresa/admin já cadastrados. */
  resetBusiness: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Sobe a aplicação Nest completa apontando para o banco de teste, garantindo o
 * schema via migrations. Use em testes e2e/integração de HTTP. `configure`
 * permite substituir providers (ex.: mockar o client do Mercado Pago).
 */
export async function createTestApp(
  configure?: (
    builder: ReturnType<typeof Test.createTestingModule>,
  ) => ReturnType<typeof Test.createTestingModule>,
): Promise<TestApp> {
  process.env.NODE_ENV = "test";

  let builder = Test.createTestingModule({
    imports: [AppModule],
  });
  if (configure) builder = configure(builder);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();

  return {
    app,
    dataSource,
    // Emails são únicos por rodada (auth-helper), então não é preciso "limpar"
    // o Firebase entre testes — basta truncar o banco.
    reset: async () => {
      await truncateAll(dataSource);
    },
    resetBusiness: async () => {
      await truncateBusiness(dataSource);
    },
    close: async () => {
      await deleteTrackedUsers();
      await app.close();
    },
  };
}
