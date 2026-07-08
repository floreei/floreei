/**
 * ESLint da API (NestJS). Foco em segurança (eslint-plugin-security) e correção,
 * sem estilo excessivo — o que pega bug/risco real, não formatação.
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint", "security"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:security/recommended-legacy",
  ],
  env: { node: true, es2022: true },
  ignorePatterns: ["dist", "node_modules", ".eslintrc.cjs", "jest.config.*"],
  rules: {
    // Acusa qualquer obj[key] — falso-positivo demais num app com muito acesso
    // dinâmico legítimo (repositórios, DTOs, mapas). Desligado.
    "security/detect-object-injection": "off",
    // Entidades/DTOs do Nest usam `!` (definite assignment) e `any` pontual em
    // queries cruas — não é o alvo aqui; mantemos como aviso, não erro.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
};
