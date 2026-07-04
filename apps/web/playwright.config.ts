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
      command: "pnpm --filter @sistema-flores/api emulator",
      url: "http://127.0.0.1:9099/",
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      command:
        "FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 pnpm --filter @sistema-flores/api start:e2e",
      url: "http://localhost:3001/api/health",
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      // next dev para aplicar o emulador em runtime (o build de dev aponta pro Firebase real).
      command:
        "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 pnpm --filter @sistema-flores/web dev",
      url: "http://localhost:3000",
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
