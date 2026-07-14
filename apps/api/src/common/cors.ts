import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

/**
 * Decide se uma origem do browser é permitida. Além da lista exata
 * (`CORS_ORIGINS`), aceita QUALQUER subdomínio de um sufixo confiável
 * (`CORS_ORIGIN_SUFFIXES`, ex.: `.floreei.com.br`) — assim o ERP, o admin e
 * TODAS as lojas por subdomínio (incl. a Floravie e as lojas geradas por slug)
 * passam sem precisar listar uma a uma. O ponto no sufixo evita casar
 * `evilfloreei.com.br` com `.floreei.com.br`.
 */
export function isAllowedOrigin(
  origin: string,
  origins: string[],
  suffixes: string[],
): boolean {
  if (origins.includes(origin)) return true;
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  return suffixes.some((suffix) => {
    const apex = suffix.startsWith(".") ? suffix.slice(1) : suffix;
    const dotted = suffix.startsWith(".") ? suffix : `.${suffix}`;
    return host === apex || host.endsWith(dotted);
  });
}

/** Lê CSV de env (vírgula) → lista limpa. */
export function parseCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Monta a opção de CORS. Sem nenhuma configuração (dev), libera geral (`true`).
 * Com lista/sufixos (produção), valida cada origem — requisições sem `Origin`
 * (curl, server-to-server, webhooks) são liberadas.
 */
export function buildCorsOptions(
  origins: string[],
  suffixes: string[],
): CorsOptions | boolean {
  if (origins.length === 0 && suffixes.length === 0) return true;
  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, isAllowedOrigin(origin, origins, suffixes));
    },
  };
}
