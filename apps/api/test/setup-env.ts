import * as dotenv from "dotenv";

// Carrega apps/api/.env nos testes e2e (FIREBASE_API_KEY, FIREBASE_PROJECT_ID,
// TEST_DATABASE_*) para não hardcodar valores nos specs. cwd = apps/api ao rodar
// `test:e2e`. dotenv não sobrescreve variáveis já definidas no ambiente.
dotenv.config({ path: [".env.local", ".env"] });
