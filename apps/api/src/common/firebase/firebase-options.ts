import { applicationDefault, type AppOptions } from "firebase-admin/app";

/**
 * Opções de inicialização do Firebase Admin conforme o ambiente:
 * - Emulador (dev/test): só o projectId, sem credenciais.
 * - Produção com service account: Application Default Credentials.
 * - Sem service account: só o projectId — login/verifyIdToken funcionam; operações
 *   de admin (ex.: criar membro de equipe) exigem a service account.
 */
export function firebaseAppOptions(): AppOptions {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    "demo-sistema-flores";

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) return { projectId };
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { credential: applicationDefault(), projectId };
  }
  return { projectId };
}
