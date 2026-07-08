import { defineConfig, devices } from "@playwright/test";

/**
 * E2E do fluxo principal. Sobe a API (NestJS) e o web (Next.js) e roda o
 * Chromium contra o banco de desenvolvimento (já migrado).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      // API em NODE_ENV=test: usa o banco de TESTE, pula a verificação de e-mail
      // e relaxa o rate limit — necessário para o cadastro via UI concluir no
      // Firebase real (que não permite confirmar e-mail num teste).
      command:
        "NODE_ENV=test FIREBASE_PROJECT_ID=meuflorista-7dfd5 pnpm --filter @sistema-flores/api start:e2e",
      url: "http://localhost:3001/api/health",
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      // Build + start (produção) com NEXT_PUBLIC_E2E: rotas pré-compiladas
      // (sem a lentidão do dev compilando cada rota na 1ª visita). A flag faz o
      // cadastro provisionar direto (sem verificação de e-mail) e some as
      // boas-vindas. Esse build fica só no .next local; nunca é publicado.
      command:
        "NEXT_PUBLIC_E2E=true pnpm --filter @sistema-flores/web build && NEXT_PUBLIC_E2E=true pnpm --filter @sistema-flores/web start:e2e",
      url: "http://localhost:3000",
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
