import type { APIRequestContext } from "@playwright/test";

const IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1";
// Carregada do apps/web/.env pelo playwright.config (dev) ou do env do CI.
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

/**
 * Autentica no Firebase (real) e devolve um ID token — usado para semear dados via
 * API nos testes (o token não fica no localStorage, e sim no SDK).
 */
export async function firebaseIdToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(
    `${IDENTITY_URL}/accounts:signInWithPassword?key=${API_KEY}`,
    { data: { email, password, returnSecureToken: true } },
  );
  if (!res.ok()) {
    throw new Error(`Firebase signIn falhou: ${res.status()} ${await res.text()}`);
  }
  return ((await res.json()) as { idToken: string }).idToken;
}
