/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  setupFiles: ["reflect-metadata"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Cobertura dos testes UNITÁRIOS foca na lógica de domínio (funções puras);
  // o grosso da API é validado pela suíte e2e (test/*.e2e-spec.ts).
  collectCoverageFrom: ["**/domain/**/*.ts", "**/*.calculator.ts"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
