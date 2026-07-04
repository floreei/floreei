import type { APIRequestContext } from "@playwright/test";

const EMULATOR_HOST =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
// Sob o emulador qualquer apiKey serve.
const IDENTITY_URL = `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;

/**
 * Autentica no emulador do Firebase e devolve um ID token — usado para semear
 * dados via API nos testes (o token não fica mais no localStorage, e sim no SDK).
 */
export async function firebaseIdToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(
    `${IDENTITY_URL}/accounts:signInWithPassword?key=fake-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  if (!res.ok()) {
    throw new Error(`Firebase signIn falhou: ${res.status()} ${await res.text()}`);
  }
  return ((await res.json()) as { idToken: string }).idToken;
}
