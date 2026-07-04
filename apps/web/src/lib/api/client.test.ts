import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getIdToken } = vi.hoisted(() => {
  const getIdToken = vi.fn<(force?: boolean) => Promise<string>>();
  return {
    getIdToken,
    authMock: {
      currentUser: null as null | { getIdToken: typeof getIdToken },
    },
  };
});

vi.mock("../firebase", () => ({ auth: authMock }));

import { api, ApiError } from "./client";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    json: async () => body,
  } as Response;
}

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authMock.currentUser = { getIdToken };
    getIdToken.mockResolvedValue("token-1");
  });

  afterEach(() => {
    authMock.currentUser = null;
  });

  it("anexa o ID token do Firebase no header Authorization", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/customers");

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-1");
    expect(getIdToken).toHaveBeenCalledWith(false);
  });

  it("não anexa header quando não há usuário autenticado", async () => {
    authMock.currentUser = null;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/customers");

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("em 401 refaz a requisição com o token renovado", async () => {
    getIdToken
      .mockResolvedValueOnce("token-velho")
      .mockResolvedValueOnce("token-novo");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "expirado" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ ok: boolean }>("/customers");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getIdToken).toHaveBeenLastCalledWith(true);
    const retryHeaders = fetchMock.mock.calls[1][1].headers as Record<
      string,
      string
    >;
    expect(retryHeaders.Authorization).toBe("Bearer token-novo");
  });

  it("propaga o erro quando o retry também falha", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "expirado" }))
      .mockResolvedValueOnce(jsonResponse(401, { message: "ainda inválido" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/customers")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
