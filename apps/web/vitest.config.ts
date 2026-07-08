import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Foca nos helpers puros e críticos (dinheiro, documento, Pix, WhatsApp).
      // UI/páginas/hooks não têm teste unitário e ficam fora da métrica.
      include: [
        "src/lib/utils.ts",
        "src/lib/masks.ts",
        "src/lib/pix.ts",
        "src/lib/whatsapp.ts",
      ],
      thresholds: {
        // Piso anti-regressão (abaixo do atual). Suba ao adicionar testes.
        functions: 70,
        lines: 55,
        statements: 55,
        branches: 78,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
