import type { PublicUser } from "@sistema-flores/types";
import request from "supertest";

type Http = ReturnType<typeof request>;

export interface TestAuth {
  user: PublicUser;
  /** ID token do Firebase — use com `bearer()`. */
  accessToken: string;
  /** E-mail realmente usado (único por rodada) — use para `loginAs`/asserções. */
  email: string;
  password: string;
}

const API_KEY =
  process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!API_KEY) {
  throw new Error(
    "FIREBASE_API_KEY ausente — configure apps/api/.env (ver .env.example).",
  );
}
const IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1";

/**
 * Sem emulador, os testes batem no Firebase real: os usuários persistem entre
 * execuções. Cada rodada usa um namespace único (evita EMAIL_EXISTS entre runs) e
 * os tokens criados são apagados no teardown (best-effort). Ver `deleteTrackedUsers`.
 */
const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let seq = 0;
const createdTokens: string[] = [];

/** E-mail único por chamada, válido só para testes (TLD reservado `.test`). */
export function uniqueEmail(prefix = "user"): string {
  seq += 1;
  const slug =
    prefix.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
  return `${slug}.${RUN}.${seq}@e2e.flores.test`;
}

// CNPJ (14 dígitos) único por chamada e por rodada — o banco de teste persiste
// entre execuções e o cadastro trava documento repetido (409).
let docCounter = Date.now();
export function uniqueDocument(): string {
  docCounter += 1;
  return String(docCounter).padStart(14, "0").slice(-14);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface IdentityError extends Error {
  status?: number;
  body?: string;
}

// Auto-throttle: o Firebase real limita cadastros/logins por IP em rajada. Como a
// suíte roda em série (--runInBand), espaçamos as chamadas de auth para ficar bem
// abaixo do limite (evita TOO_MANY_ATTEMPTS). Ajustável por env.
const MIN_INTERVAL_MS = Number(process.env.E2E_AUTH_MIN_INTERVAL_MS ?? 700);
let lastCallAt = 0;
async function pace(): Promise<void> {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
}

/**
 * POST no Identity Toolkit real com retentativa exponencial. O Firebase limita
 * cadastros/logins por IP (`TOO_MANY_ATTEMPTS_TRY_LATER`); sob carga da suíte
 * isso aparece em rajada, então esperamos e tentamos de novo até o throttle drenar.
 */
async function identityPost(
  path: string,
  body: unknown,
  tries = 3,
): Promise<Record<string, unknown>> {
  let lastText = "";
  for (let i = 0; i < tries; i += 1) {
    try {
      await pace();
      const res = await fetch(`${IDENTITY_URL}/${path}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
      lastText = await res.text();
      // Rate limit ou erro de servidor → espera pouco e tenta de novo (fail-fast:
      // nunca martelar o throttle por muito tempo).
      if (lastText.includes("TOO_MANY_ATTEMPTS_TRY_LATER") || res.status >= 500) {
        await sleep(700 * (i + 1));
        continue;
      }
      // Erro definitivo (EMAIL_EXISTS, senha fraca, etc.) → propaga.
      const err: IdentityError = new Error(lastText);
      err.status = res.status;
      err.body = lastText;
      throw err;
    } catch (error) {
      if ((error as IdentityError).body !== undefined) throw error;
      await sleep(1500 * (i + 1)); // erro de rede
    }
  }
  const err: IdentityError = new Error(
    `Identity Toolkit falhou após ${tries} tentativas: ${lastText}`,
  );
  err.body = lastText;
  throw err;
}

/** Cria um usuário no Firebase e devolve um ID token. */
export async function firebaseSignUp(
  email: string,
  password: string,
): Promise<string> {
  let data: Record<string, unknown>;
  try {
    data = await identityPost("accounts:signUp", {
      email,
      password,
      returnSecureToken: true,
    });
  } catch (error) {
    // Órfão de uma rodada anterior que falhou no meio: reaproveita via login.
    if ((error as IdentityError).body?.includes("EMAIL_EXISTS")) {
      return firebaseSignIn(email, password);
    }
    throw error;
  }
  const idToken = data.idToken as string;
  createdTokens.push(idToken);
  return idToken;
}

/** Autentica no Firebase e devolve um ID token. */
export async function firebaseSignIn(
  email: string,
  password: string,
): Promise<string> {
  const data = await identityPost("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  const idToken = data.idToken as string;
  createdTokens.push(idToken);
  return idToken;
}

/**
 * Apaga os usuários criados nesta rodada (best-effort, via o próprio ID token).
 * Os e-mails são únicos por rodada, então a limpeza é só higiene do projeto real —
 * fica **desligada por padrão** para não dobrar as chamadas de auth (e o rate
 * limit); habilite com `E2E_CLEANUP_USERS=1`.
 */
export async function deleteTrackedUsers(): Promise<void> {
  const tokens = createdTokens.splice(0);
  if (process.env.E2E_CLEANUP_USERS !== "1") return;
  for (const idToken of tokens) {
    await pace();
    await fetch(`${IDENTITY_URL}/accounts:delete?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }).catch(() => undefined);
  }
}

/**
 * Cadastra uma nova empresa + admin (cria no Firebase e provisiona no backend)
 * e devolve o usuário público + o ID token + o e-mail realmente usado.
 */
export async function registerCompany(
  http: Http,
  overrides: Partial<{
    companyName: string;
    name: string;
    document: string;
    email: string;
    password: string;
  }> = {},
): Promise<TestAuth> {
  const email = uniqueEmail(overrides.email ?? "admin");
  const password = overrides.password ?? "Segredo123!";
  const companyName = overrides.companyName ?? `Empresa ${seq}`;
  const name = overrides.name ?? "Admin";
  const document = overrides.document ?? uniqueDocument();
  const idToken = await firebaseSignUp(email, password);
  const res = await http
    .post("/api/auth/provision")
    .set("Authorization", `Bearer ${idToken}`)
    .send({ companyName, name, document })
    .expect(201);
  return { user: res.body as PublicUser, accessToken: idToken, email, password };
}

/**
 * Convida um membro (novo fluxo: sem senha) e ACEITA o convite definindo a
 * senha — deixa o membro pronto para `loginAs`. Retorna o usuário criado.
 */
export async function inviteMember(
  http: Http,
  adminToken: string,
  input: { name: string; email: string; role?: string; password?: string },
): Promise<{ user: PublicUser; password: string }> {
  const password = input.password ?? "Segredo123!";
  const res = await http
    .post("/api/users")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: input.name, email: input.email, role: input.role ?? "OPERATOR" })
    .expect(201);
  const token = new URL(res.body.inviteUrl as string).searchParams.get("token");
  await http
    .post("/api/auth/accept-invite")
    .send({ token, password })
    .expect(201);
  return { user: res.body.user as PublicUser, password };
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
  return { user: res.body as PublicUser, accessToken: idToken, email, password };
}

/** Header Authorization pronto para uso. */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
