import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ZodValidationPipe } from "nestjs-zod";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { clearFirebaseUsers } from "./auth-helper";
import { truncateAll } from "./test-database";

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Sobe a aplicação Nest completa apontando para o banco de teste, garantindo o
 * schema via migrations. Use em testes e2e/integração de HTTP.
 */
export async function createTestApp(): Promise<TestApp> {
  process.env.NODE_ENV = "test";

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();

  return {
    app,
    dataSource,
    reset: async () => {
      await truncateAll(dataSource);
      await clearFirebaseUsers();
    },
    close: () => app.close(),
  };
}
