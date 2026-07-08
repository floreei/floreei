import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Só a lógica de negócio (funções puras) — schemas/tipos não contam.
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,spec}.ts", "src/index.ts"],
      thresholds: {
        // Piso anti-regressão (abaixo do atual): a cobertura não pode CAIR.
        // Suba estes números conforme novos testes forem adicionados.
        functions: 38,
        lines: 44,
        statements: 44,
        branches: 70,
      },
    },
  },
});
