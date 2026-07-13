import { Injectable } from "@nestjs/common";
import type {
  NfeCancelResult,
  NfeEmissionRequest,
  NfeEmissionResult,
  NfeProviderPort,
  NfeStatusResult,
} from "../ports/nfe-provider.port";

/**
 * Adaptador real de emissão fiscal via Focus NFe (TecnoSpeed) — REST/JSON, sem
 * SDK, `fetch` puro (mesmo padrão de anthropic.provider/whatsapp.service). A
 * mesma conta emite NFC-e (varejo) e NF-e (atacado); a empresa emitente é
 * selecionada pelo CNPJ do emitente no payload (modelo de conta única do
 * Floreei). O certificado A1 fica cadastrado no Focus, não no Floreei.
 *
 * O `ref` (id do InvoiceEntity) é enviado ao Focus e usado como chave em todas
 * as operações (emitir/consultar/cancelar), garantindo idempotência.
 */
@Injectable()
export class FocusNfeProvider implements NfeProviderPort {
  readonly name = "FOCUS";

  constructor(
    private readonly token: string,
    private readonly baseUrl: string,
  ) {}

  private headers(): Record<string, string> {
    // Focus usa HTTP Basic com o token no usuário e senha vazia.
    const basic = Buffer.from(`${this.token}:`).toString("base64");
    return {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    };
  }

  private path(documentType: NfeEmissionRequest["documentType"]): string {
    return documentType === "NFE" ? "nfe" : "nfce";
  }

  /** Prefixa a base quando o Focus devolve caminho relativo de XML/DANFE. */
  private absolute(path: string | null | undefined): string | null {
    if (!path) return null;
    return path.startsWith("http") ? path : `${this.baseUrl}${path}`;
  }

  async emit(request: NfeEmissionRequest): Promise<NfeEmissionResult> {
    const resource = this.path(request.documentType);
    const body = buildFocusPayload(request);
    const res = await fetch(
      `${this.baseUrl}/v2/${resource}?ref=${encodeURIComponent(request.ref)}`,
      { method: "POST", headers: this.headers(), body: JSON.stringify(body) },
    );
    const data = (await res.json().catch(() => ({}))) as FocusResponse;

    // Erro de validação/negócio do Focus (4xx) — vira REJECTED com a mensagem,
    // sem lançar, pra nunca derrubar a venda.
    if (!res.ok && data.status !== "processando_autorizacao") {
      return {
        status: "REJECTED",
        rejectionReason: focusErrorMessage(data),
        raw: data,
      };
    }
    return this.mapResult(request.ref, data);
  }

  async checkStatus(ref: string): Promise<NfeStatusResult> {
    // Consulta o recurso NFC-e; se não achar, tenta NF-e (a conta é a mesma).
    const data = await this.fetchByRef(ref);
    if (!data) {
      return {
        status: "REJECTED",
        rejectionReason: "Nota não encontrada no provedor.",
      };
    }
    const mapped = this.mapResult(ref, data);
    return {
      status: mapped.status,
      accessKey: mapped.accessKey ?? null,
      protocol: mapped.protocol ?? null,
      xmlUrl: mapped.xmlUrl ?? null,
      danfeUrl: mapped.danfeUrl ?? null,
      rejectionReason: mapped.rejectionReason ?? null,
    };
  }

  async cancel(ref: string, reason: string): Promise<NfeCancelResult> {
    for (const resource of ["nfce", "nfe"] as const) {
      const res = await fetch(
        `${this.baseUrl}/v2/${resource}/${encodeURIComponent(ref)}`,
        {
          method: "DELETE",
          headers: this.headers(),
          body: JSON.stringify({ justificativa: reason }),
        },
      );
      if (res.status === 404) continue; // recurso do outro tipo de nota
      const data = (await res.json().catch(() => ({}))) as FocusResponse;
      if (res.ok || data.status === "cancelado") {
        return { status: "CANCELED", cancelReason: reason, raw: data };
      }
      return {
        status: "REJECTED",
        cancelReason: focusErrorMessage(data),
        raw: data,
      };
    }
    return {
      status: "REJECTED",
      cancelReason: "Nota não encontrada no provedor para cancelamento.",
    };
  }

  private async fetchByRef(ref: string): Promise<FocusResponse | null> {
    for (const resource of ["nfce", "nfe"] as const) {
      const res = await fetch(
        `${this.baseUrl}/v2/${resource}/${encodeURIComponent(ref)}`,
        { method: "GET", headers: this.headers() },
      );
      if (res.status === 404) continue;
      return (await res.json().catch(() => ({}))) as FocusResponse;
    }
    return null;
  }

  private mapResult(ref: string, data: FocusResponse): NfeEmissionResult {
    switch (data.status) {
      case "autorizado":
        return {
          status: "AUTHORIZED",
          providerInvoiceId: ref,
          accessKey: data.chave_nfe ?? null,
          protocol: data.numero_protocolo ?? null,
          number: data.numero ? Number(data.numero) : null,
          series: data.serie ?? null,
          xmlUrl: this.absolute(data.caminho_xml_nota_fiscal),
          danfeUrl: this.absolute(data.caminho_danfe),
          raw: data,
        };
      case "cancelado":
        return {
          status: "REJECTED",
          providerInvoiceId: ref,
          rejectionReason: "Nota cancelada no provedor.",
          raw: data,
        };
      case "erro_autorizacao":
      case "denegado":
        return {
          status: "REJECTED",
          providerInvoiceId: ref,
          rejectionReason: focusErrorMessage(data),
          raw: data,
        };
      default:
        // processando_autorizacao (e quaisquer estados intermediários).
        return { status: "PROCESSING", providerInvoiceId: ref, raw: data };
    }
  }
}

interface FocusResponse {
  status?: string;
  numero?: string;
  serie?: string;
  chave_nfe?: string;
  numero_protocolo?: string;
  caminho_xml_nota_fiscal?: string;
  caminho_danfe?: string;
  mensagem_sefaz?: string;
  mensagem?: string;
  erros?: { mensagem?: string; campo?: string }[];
  [key: string]: unknown;
}

function focusErrorMessage(data: FocusResponse): string {
  if (data.mensagem_sefaz) return data.mensagem_sefaz;
  if (data.erros?.length) {
    return data.erros
      .map((e) => (e.campo ? `${e.campo}: ${e.mensagem}` : e.mensagem))
      .filter(Boolean)
      .join("; ");
  }
  return data.mensagem ?? "Falha ao processar a nota no provedor fiscal.";
}

/** Monta o corpo JSON esperado pelo Focus a partir do DTO plano do domínio. */
function buildFocusPayload(req: NfeEmissionRequest): Record<string, unknown> {
  const { issuer, recipient, fiscalDefaults: fd } = req;
  const isNfe = req.documentType === "NFE";
  const origem = fd.origem ?? "0";
  const situacao = fd.icmsCsosn ?? fd.icmsCst ?? "102";
  // Operação interna quando emitente e destinatário estão na mesma UF.
  const interstate = Boolean(
    recipient?.address?.state &&
      issuer.address.state &&
      recipient.address.state !== issuer.address.state,
  );
  const cfop = (interstate ? fd.cfopOutState : fd.cfopInState) ?? "5102";

  const items = req.items.map((item, index) => ({
    numero_item: index + 1,
    codigo_produto: String(index + 1),
    descricao: item.description,
    cfop,
    unidade_comercial: "UN",
    quantidade_comercial: item.quantity,
    valor_unitario_comercial: item.unitPrice,
    valor_bruto: round2(item.quantity * item.unitPrice),
    unidade_tributavel: "UN",
    quantidade_tributavel: item.quantity,
    valor_unitario_tributavel: item.unitPrice,
    ncm: item.ncm ?? undefined,
    icms_origem: origem,
    icms_situacao_tributaria: situacao,
  }));

  const payload: Record<string, unknown> = {
    cnpj_emitente: onlyDigits(issuer.document),
    data_emissao: new Date().toISOString(),
    natureza_operacao: fd.naturezaOperacao ?? "Venda de mercadoria",
    presenca_comprador: isNfe ? "9" : "1", // NFC-e: presencial; NF-e: não se aplica
    modalidade_frete: "9", // sem transporte
    local_destino: interstate ? "2" : "1",
    valor_total: round2(req.totalValue),
    items,
  };

  if (isNfe) {
    payload.tipo_documento = "1"; // saída
    payload.finalidade_emissao = "1"; // normal
    payload.consumidor_final = recipient?.documentType === "CNPJ" ? "0" : "1";
  }

  if (recipient) {
    payload.nome_destinatario = recipient.name;
    if (recipient.documentType === "CNPJ") {
      payload.cnpj_destinatario = onlyDigits(recipient.document);
    } else if (recipient.documentType === "CPF") {
      payload.cpf_destinatario = onlyDigits(recipient.document);
    }
    if (recipient.email) payload.email_destinatario = recipient.email;
    payload.indicador_inscricao_estadual_destinatario =
      recipient.stateRegistration ? "1" : "9";
    if (recipient.stateRegistration) {
      payload.inscricao_estadual_destinatario = recipient.stateRegistration;
    }
    const addr = recipient.address;
    if (addr) {
      payload.logradouro_destinatario = addr.street ?? undefined;
      payload.numero_destinatario = addr.number ?? undefined;
      payload.complemento_destinatario = addr.complement ?? undefined;
      payload.bairro_destinatario = addr.neighborhood ?? undefined;
      payload.municipio_destinatario = addr.city ?? undefined;
      payload.codigo_municipio_destinatario = addr.cityCode ?? undefined;
      payload.uf_destinatario = addr.state ?? undefined;
      payload.cep_destinatario = onlyDigits(addr.zip);
    }
  }

  return payload;
}

function onlyDigits(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  return digits.length ? digits : undefined;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
