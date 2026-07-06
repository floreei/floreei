import { applicationDefault, type AppOptions } from "firebase-admin/app";

/** Projeto do Firebase (sempre o real; sem emulador). Vem de env (ver .env.example). */
export function firebaseProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "";
}

/**
 * Há credenciais de admin (service account via Application Default Credentials)?
 * Operações privilegiadas (criar/apagar usuário) usam o Admin SDK quando sim; sem
 * elas, caímos no Identity Toolkit REST com a apiKey pública.
 */
export function hasFirebaseAdminCredentials(): boolean {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

/** apiKey pública para chamadas REST do Identity Toolkit (login/cadastro). */
export function firebaseWebApiKey(): string {
  return (
    process.env.FIREBASE_API_KEY ??
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    ""
  );
}

/**
 * Opções de inicialização do Firebase Admin:
 * - Com service account (`GOOGLE_APPLICATION_CREDENTIALS`): Application Default
 *   Credentials — habilita operações privilegiadas de admin.
 * - Sem service account: só o `projectId`. `verifyIdToken` e login funcionam
 *   (busca as chaves públicas do Google); criar/apagar usuário passa pelo REST.
 */
export function firebaseAppOptions(): AppOptions {
  const projectId = firebaseProjectId();
  if (hasFirebaseAdminCredentials()) {
    return { credential: applicationDefault(), projectId };
  }
  return { projectId };
}
