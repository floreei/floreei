import { applicationDefault, cert, type AppOptions } from "firebase-admin/app";

/** Projeto do Firebase (sempre o real; sem emulador). Vem de env (ver .env.example). */
export function firebaseProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "";
}

interface ServiceAccountJson {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

/**
 * Service account passada inline por env — prática no App Runner (sem montar
 * arquivo): JSON cru em `FIREBASE_SERVICE_ACCOUNT` ou base64 em
 * `FIREBASE_SERVICE_ACCOUNT_B64`. Retorna null se nenhuma estiver setada.
 */
function inlineServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const json = raw ?? (b64 ? Buffer.from(b64, "base64").toString("utf8") : null);
  if (!json) return null;
  try {
    return JSON.parse(json) as ServiceAccountJson;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT(_B64) inválido — não é um JSON de service account.",
    );
  }
}

/**
 * Rodando dentro do Google Cloud (Cloud Run seta K_SERVICE)? Lá o Application
 * Default Credentials vem do metadata server (service account de runtime) —
 * Admin SDK funciona sem arquivo/JSON de service account.
 */
function isRunningOnGcp(): boolean {
  return Boolean(process.env.K_SERVICE);
}

/**
 * Há credenciais de admin? Operações privilegiadas (criar/apagar usuário) usam
 * o Admin SDK quando sim; sem elas, caímos no Identity Toolkit REST com a
 * apiKey pública. Aceita o arquivo (`GOOGLE_APPLICATION_CREDENTIALS`), o JSON
 * inline por env, ou o ADC nativo do Google Cloud (Cloud Run).
 */
export function hasFirebaseAdminCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_SERVICE_ACCOUNT_B64 ||
      isRunningOnGcp(),
  );
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
  // JSON inline por env (App Runner) tem precedência sobre o arquivo ADC.
  const inline = inlineServiceAccount();
  if (inline) {
    return {
      credential: cert({
        projectId: inline.project_id ?? projectId,
        clientEmail: inline.client_email,
        privateKey: inline.private_key,
      }),
      projectId,
    };
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || isRunningOnGcp()) {
    return { credential: applicationDefault(), projectId };
  }
  return { projectId };
}
