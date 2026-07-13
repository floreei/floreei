import { FocusNfeProvider } from "./focus-nfe.provider";
import type { NfeEmissionRequest } from "../ports/nfe-provider.port";

const BASE = "https://homologacao.focusnfe.com.br";

function mockFetchOnce(status: number, data: unknown) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function baseRequest(overrides: Partial<NfeEmissionRequest> = {}): NfeEmissionRequest {
  return {
    ref: "inv-1",
    documentType: "NFCE",
    issuer: {
      companyId: "c1",
      name: "Floricultura Teste",
      document: "55.815.248/0001-00",
      stateRegistration: "ISENTO",
      taxRegime: "Simples Nacional",
      address: {
        street: "Rua A",
        number: "10",
        complement: null,
        neighborhood: "Centro",
        city: "Igarassu",
        state: "PE",
        zip: "53600-000",
        cityCode: "2606804",
      },
    },
    recipient: null,
    fiscalDefaults: {
      environment: "HOMOLOGACAO",
      naturezaOperacao: "Venda de mercadoria",
      cfopInState: "5102",
      cfopOutState: "6102",
      icmsCsosn: "102",
      icmsCst: null,
      origem: "0",
    },
    items: [
      { description: "Rosa", quantity: 12, unitPrice: 3.5, ncm: "06031100" },
    ],
    totalValue: 42,
    ...overrides,
  };
}

describe("FocusNfeProvider", () => {
  const provider = new FocusNfeProvider("tk", BASE);

  afterEach(() => jest.restoreAllMocks());

  it("emite NFC-e usando o ref e os padrões da empresa", async () => {
    const fetchMock = mockFetchOnce(202, { status: "processando_autorizacao" });

    const result = await provider.emit(baseRequest());

    expect(result.status).toBe("PROCESSING");
    expect(result.providerInvoiceId).toBe("inv-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/v2/nfce?ref=inv-1`);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.cnpj_emitente).toBe("55815248000100"); // só dígitos
    expect(body.natureza_operacao).toBe("Venda de mercadoria");
    expect(body.items[0].cfop).toBe("5102"); // operação interna (mesma UF)
    expect(body.items[0].ncm).toBe("06031100");
    expect(body.items[0].icms_situacao_tributaria).toBe("102");
    expect(body.items[0].icms_origem).toBe("0");
  });

  it("mapeia autorizado com chave e caminhos absolutos", async () => {
    mockFetchOnce(200, {
      status: "autorizado",
      numero: "123",
      serie: "1",
      chave_nfe: "5".repeat(44),
      caminho_xml_nota_fiscal: "/arquivos/xml/1.xml",
      caminho_danfe: "/arquivos/danfe/1.pdf",
    });

    const result = await provider.checkStatus("inv-1");

    expect(result.status).toBe("AUTHORIZED");
    expect(result.accessKey).toBe("5".repeat(44));
    expect(result.xmlUrl).toBe(`${BASE}/arquivos/xml/1.xml`);
    expect(result.danfeUrl).toBe(`${BASE}/arquivos/danfe/1.pdf`);
  });

  it("na NF-e interestadual usa CFOP de fora e o CNPJ do destinatário", async () => {
    const fetchMock = mockFetchOnce(202, { status: "processando_autorizacao" });

    await provider.emit(
      baseRequest({
        ref: "inv-2",
        documentType: "NFE",
        recipient: {
          name: "Lojista SP",
          document: "11.222.333/0001-81",
          documentType: "CNPJ",
          stateRegistration: "123456",
          email: "lojista@sp.com",
          address: {
            street: "Av. Paulista",
            number: "1000",
            complement: null,
            neighborhood: "Bela Vista",
            city: "São Paulo",
            cityCode: "3550308",
            state: "SP",
            zip: "01310-100",
          },
        },
      }),
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/v2/nfe?ref=inv-2`);
    const body = JSON.parse(init.body);
    expect(body.items[0].cfop).toBe("6102"); // PE -> SP: interestadual
    expect(body.cnpj_destinatario).toBe("11222333000181");
    expect(body.local_destino).toBe("2");
    expect(body.inscricao_estadual_destinatario).toBe("123456");
    expect(body.municipio_destinatario).toBe("São Paulo");
  });

  it("cancela quando o Focus confirma", async () => {
    mockFetchOnce(200, { status: "cancelado" });
    const result = await provider.cancel("inv-1", "Erro de digitação");
    expect(result.status).toBe("CANCELED");
    expect(result.cancelReason).toBe("Erro de digitação");
  });

  it("emissão com erro do provedor vira REJECTED com a mensagem", async () => {
    mockFetchOnce(422, {
      status: "erro_validacao_schema",
      mensagem: "cnpj_emitente inválido",
    });
    const result = await provider.emit(baseRequest());
    expect(result.status).toBe("REJECTED");
    expect(result.rejectionReason).toMatch(/cnpj_emitente inválido/);
  });
});
