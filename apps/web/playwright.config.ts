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
      // API contra o Firebase real (sem emulador). O projectId garante que o
      // verifyIdToken valide os tokens do projeto certo.
      command:
        "FIREBASE_PROJECT_ID=***REMOVED*** pnpm --filter @sistema-flores/api start:e2e",
      url: "http://localhost:3001/api/health",
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      // next dev — a config de dev já aponta para o Firebase real (auth + storage).
      command: "pnpm --filter @sistema-flores/web dev",
      url: "http://localhost:3000",
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
