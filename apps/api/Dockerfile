# Imagem de produção da API (NestJS) — monorepo pnpm. Build do contexto na RAIZ:
#   docker build -f apps/api/Dockerfile -t floreei-api .
# syntax=docker/dockerfile:1

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
WORKDIR /repo

# ---- Builder: instala o workspace, builda types + api, gera bundle de prod ----
FROM base AS builder
# Manifests primeiro (camada de install cacheável)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/landing/package.json ./apps/landing/
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# Fonte necessária para buildar a API (types + config + api)
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @sistema-flores/types build \
 && pnpm --filter @sistema-flores/api build

# Bundle autocontido só com dependências de produção (inclui @sistema-flores/types já buildado).
# --legacy: exigido pelo pnpm v10 para deploy sem inject-workspace-packages.
RUN pnpm --filter=@sistema-flores/api deploy --legacy --prod /app/out

# ---- Runner: imagem enxuta só com o necessário ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=builder /app/out ./
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 8080
CMD ["./docker-entrypoint.sh"]
