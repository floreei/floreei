import { getSelectedCompanyId } from "../auth/company";
import { auth } from "../firebase";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Código de negócio do erro (ex.: TRIAL_EXPIRED), quando a API envia. */
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Não anexa o token do Firebase (rotas públicas). */
  skipAuth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText;
  let code: string | undefined;
  try {
    const data = await res.json();
    if (typeof data?.message === "string") message = data.message;
    else if (Array.isArray(data?.message)) message = data.message.join(", ");
    if (typeof data?.code === "string") code = data.code;
  } catch {
    // corpo não-JSON
  }
  return new ApiError(res.status, message, code);
}

async function buildHeaders(
  options: RequestOptions,
  forceRefresh: boolean,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (!options.skipAuth && auth.currentUser) {
    // O SDK do Firebase renova o ID token automaticamente; forçamos só no retry.
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken(forceRefresh)}`;
    // Login multi-conta: informa qual empresa foi escolhida (se houver).
    const companyId = getSelectedCompanyId();
    if (companyId) headers["x-company-id"] = companyId;
  }
  return headers;
}

async function raw<T>(
  path: string,
  options: RequestOptions,
  forceRefresh = false,
): Promise<T> {
  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: await buildHeaders(options, forceRefresh),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;
  if (res.ok) return (await res.json()) as T;
  throw await parseError(res);
}

/**
 * Faz uma requisição autenticada. Em 401, tenta uma vez com o ID token forçado
 * (cobre o caso raro de token expirado que o SDK ainda não renovou).
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await raw<T>(path, options);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !options.skipAuth &&
      auth.currentUser
    ) {
      return raw<T>(path, options, true);
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) =>
    apiFetch<T>(path, { query }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
