import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  // Logo da empresa (base64) pode passar do limite padrão de 100kb.
  app.useBodyParser("json", { limit: "5mb" });
  app.useGlobalPipes(new ZodValidationPipe());

  const port = config.get<number>("PORT") ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API rodando em http://localhost:${port}/api`);
}

void bootstrap();
