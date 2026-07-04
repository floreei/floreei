import type { PublicUser } from "@sistema-flores/types";
import request from "supertest";

type Http = ReturnType<typeof request>;

export interface TestAuth {
  user: PublicUser;
  /** ID token do Firebase — use com `bearer()`. */
  accessToken: string;
}

let counter = 0;

const EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  "meuflorista-7dfd5";
// Sob o emulador qualquer apiKey serve.
const API_KEY = "fake-api-key";
const IDENTITY_URL = `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;

/** Cria um usuário no emulador do Firebase e devolve um ID token. */
export async function firebaseSignUp(
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${IDENTITY_URL}/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) {
    throw new Error(`Firebase signUp falhou: ${res.status} ${await res.text()}`);
  }
  return ((await res.json()) as { idToken: string }).idToken;
}

/** Autentica no emulador do Firebase e devolve um ID token. */
export async function firebaseSignIn(
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(
    `${IDENTITY_URL}/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  if (!res.ok) {
    throw new Error(`Firebase signIn falhou: ${res.status} ${await res.text()}`);
  }
  return ((await res.json()) as { idToken: string }).idToken;
}

/** Apaga todas as contas do emulador (entre testes). */
export async function clearFirebaseUsers(): Promise<void> {
  await fetch(
    `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: "DELETE" },
  ).catch(() => undefined);
}

/**
 * Cadastra uma nova empresa + admin (cria no Firebase e provisiona no backend)
 * e devolve o usuário público + o ID token.
 */
export async function registerCompany(
  http: Http,
  overrides: Partial<{
    companyName: string;
    name: string;
    email: string;
    password: string;
  }> = {},
): Promise<TestAuth> {
  counter += 1;
  const payload = {
    companyName: overrides.companyName ?? `Empresa ${counter}`,
    name: overrides.name ?? `Admin ${counter}`,
    email: overrides.email ?? `admin${counter}@empresa.com`,
    password: overrides.password ?? "segredo123",
  };
  const idToken = await firebaseSignUp(payload.email, payload.password);
  const res = await http
    .post("/api/auth/provision")
    .set("Authorization", `Bearer ${idToken}`)
    .send({ companyName: payload.companyName, name: payload.name })
    .expect(201);
  return { user: res.body as PublicUser, accessToken: idToken };
}

/** Faz login (Firebase) e devolve o perfil + ID token. */
export async function loginAs(
  http: Http,
  email: string,
  password: string,
): Promise<TestAuth> {
  const idToken = await firebaseSignIn(email, password);
  const res = await http
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${idToken}`)
    .expect(200);
  return { user: res.body as PublicUser, accessToken: idToken };
}

/** Header Authorization pronto para uso. */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
