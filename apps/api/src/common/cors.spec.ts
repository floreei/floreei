import { buildCorsOptions, isAllowedOrigin, parseCsv } from "./cors";

describe("isAllowedOrigin", () => {
  const suffixes = [".floreei.com.br"];

  it("aceita origem exata da lista", () => {
    expect(
      isAllowedOrigin("https://app.exemplo.com", ["https://app.exemplo.com"], []),
    ).toBe(true);
  });

  it("aceita qualquer subdomínio do sufixo confiável (incl. a Floravie)", () => {
    expect(isAllowedOrigin("https://floravie.floreei.com.br", [], suffixes)).toBe(
      true,
    );
    expect(isAllowedOrigin("https://app.floreei.com.br", [], suffixes)).toBe(true);
    expect(isAllowedOrigin("https://loja-da-ana.floreei.com.br", [], suffixes)).toBe(
      true,
    );
  });

  it("aceita o apex do sufixo", () => {
    expect(isAllowedOrigin("https://floreei.com.br", [], suffixes)).toBe(true);
  });

  it("NÃO casa domínio parecido (evita bypass do sufixo)", () => {
    expect(isAllowedOrigin("https://evilfloreei.com.br", [], suffixes)).toBe(false);
    expect(isAllowedOrigin("https://floreei.com.br.evil.com", [], suffixes)).toBe(
      false,
    );
  });

  it("recusa origem malformada", () => {
    expect(isAllowedOrigin("nao-e-url", [], suffixes)).toBe(false);
  });
});

describe("buildCorsOptions", () => {
  it("sem config libera geral (dev)", () => {
    expect(buildCorsOptions([], [])).toBe(true);
  });

  it("com config, requisições sem Origin (curl/webhook) passam", () => {
    const opts = buildCorsOptions([], [".floreei.com.br"]);
    const origin = (
      opts as {
        origin: (
          o: string | undefined,
          cb: (err: unknown, allow?: boolean) => void,
        ) => void;
      }
    ).origin;
    const cb = jest.fn();
    origin(undefined, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });
});

describe("parseCsv", () => {
  it("limpa espaços e vazios", () => {
    expect(parseCsv(" a , ,b ,")).toEqual(["a", "b"]);
    expect(parseCsv(undefined)).toEqual([]);
  });
});
