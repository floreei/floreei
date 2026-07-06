import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

/**
 * Cifra simétrica (AES-256-GCM) para segredos por-tenant da loja — hoje o access
 * token do Mercado Pago. A chave vem de `STORE_SECRETS_KEY` (env), derivada com
 * scrypt. Formato do payload: `iv.tag.ciphertext` (base64url).
 */
const ALGO = "aes-256-gcm";

function key(): Buffer {
  const secret = process.env.STORE_SECRETS_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "STORE_SECRETS_KEY ausente ou curta (mín. 16 chars) — necessária para cifrar segredos da loja.",
    );
  }
  return scryptSync(secret, "floreei-store", 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB, tagB, dataB] = payload.split(".");
  if (!ivB || !tagB || !dataB) {
    throw new Error("Segredo cifrado em formato inválido.");
  }
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
