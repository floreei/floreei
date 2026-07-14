import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";
import { buildCorsOptions, parseCsv } from "./common/cors";

async function bootstrap() {
  // Em produção, restringe o CORS: origens exatas (CORS_ORIGINS) + subdomínios
  // confiáveis por sufixo (CORS_ORIGIN_SUFFIXES, ex.: `.floreei.com.br`, que
  // libera ERP, admin e todas as lojas por subdomínio). Sem env (dev), libera geral.
  const cors = buildCorsOptions(
    parseCsv(process.env.CORS_ORIGINS),
    parseCsv(process.env.CORS_ORIGIN_SUFFIXES),
  );

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors,
  });
  // Atrás do App Runner/proxy: confia no 1º hop para ler o IP real do cliente
  // (X-Forwarded-For). Sem isso, o rate limit e o HSTS usariam o IP do proxy.
  app.set("trust proxy", 1);
  const config = app.get(ConfigService);

  // Headers de segurança (HSTS, X-Content-Type-Options, etc.). API só serve JSON.
  app.use(helmet());
  app.setGlobalPrefix("api");
  // Logo da empresa (base64) pode passar do limite padrão de 100kb.
  app.useBodyParser("json", { limit: "5mb" });
  app.useGlobalPipes(new ZodValidationPipe());

  const port = config.get<number>("PORT") ?? 3001;
  // 0.0.0.0 para o container (App Runner/ECS) aceitar conexões externas.
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`API rodando na porta ${port} (prefixo /api)`);
}

void bootstrap();
