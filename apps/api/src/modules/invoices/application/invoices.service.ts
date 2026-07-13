import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Invoice, SalesChannel } from "@sistema-flores/types";
import { InvoiceEntity } from "../infrastructure/invoice.entity";
import { InvoiceRepository } from "../infrastructure/invoice.repository";
import {
  NFE_PROVIDER,
  type NfeEmissionResult,
  type NfeFiscalDefaults,
  type NfeIssuerData,
  type NfeItemData,
  type NfeProviderPort,
  type NfeRecipientData,
} from "./ports/nfe-provider.port";

export interface EmitInvoiceInput {
  eventId: string;
  channel: SalesChannel;
  issuer: NfeIssuerData;
  recipient: NfeRecipientData | null;
  fiscalDefaults: NfeFiscalDefaults;
  items: NfeItemData[];
  totalValue: number;
}

function toInvoice(e: InvoiceEntity): Invoice {
  return {
    id: e.id,
    companyId: e.companyId,
    eventId: e.eventId,
    documentType: e.documentType,
    status: e.status,
    provider: e.provider,
    providerInvoiceId: e.providerInvoiceId,
    accessKey: e.accessKey,
    protocol: e.protocol,
    number: e.number,
    series: e.series,
    issueDate: e.issueDate ? e.issueDate.toISOString() : null,
    xmlUrl: e.xmlUrl,
    danfeUrl: e.danfeUrl,
    rejectionReason: e.rejectionReason,
    cancelReason: e.cancelReason,
    canceledAt: e.canceledAt ? e.canceledAt.toISOString() : null,
    requestedAt: e.requestedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoices: InvoiceRepository,
    @Inject(NFE_PROVIDER) private readonly provider: NfeProviderPort,
  ) {}

  /**
   * Cria o registro e tenta emitir. Nunca lança por causa do provedor — um
   * erro inesperado (rede, timeout, bug do provider real) também vira
   * REJECTED com mensagem própria, pra nunca derrubar a venda.
   */
  async emit(input: EmitInvoiceInput): Promise<Invoice> {
    const documentType = input.channel === "WHOLESALE" ? "NFE" : "NFCE";
    const entity = this.invoices.create({
      eventId: input.eventId,
      documentType,
      status: "PROCESSING",
      provider: this.provider.name,
      requestedAt: new Date(),
    });
    const saved = await this.invoices.save(entity);

    let result: NfeEmissionResult;
    try {
      result = await this.provider.emit({
        ref: saved.id,
        documentType,
        issuer: input.issuer,
        recipient: input.recipient,
        fiscalDefaults: input.fiscalDefaults,
        items: input.items,
        totalValue: input.totalValue,
      });
    } catch (error) {
      result = {
        status: "REJECTED",
        rejectionReason:
          error instanceof Error
            ? `Falha inesperada ao emitir: ${error.message}`
            : "Falha inesperada ao emitir a nota fiscal.",
      };
    }

    await this.invoices.updateById(saved.id, {
      status: result.status,
      providerInvoiceId: result.providerInvoiceId ?? null,
      accessKey: result.accessKey ?? null,
      protocol: result.protocol ?? null,
      number: result.number ?? null,
      series: result.series ?? null,
      issueDate: result.status === "AUTHORIZED" ? new Date() : null,
      xmlUrl: result.xmlUrl ?? null,
      danfeUrl: result.danfeUrl ?? null,
      rejectionReason: result.rejectionReason ?? null,
      rawResponse: result.raw ?? null,
    });
    return toInvoice(await this.invoices.findByIdOrFail(saved.id));
  }

  async cancel(invoiceId: string, reason: string): Promise<Invoice> {
    const entity = await this.invoices.findByIdOrFail(invoiceId);
    if (entity.status !== "AUTHORIZED") {
      throw new BadRequestException(
        "Só é possível cancelar uma nota autorizada.",
      );
    }
    if (!entity.providerInvoiceId) {
      throw new BadRequestException(
        "Nota sem identificador do provedor — não é possível cancelar.",
      );
    }
    let result;
    try {
      result = await this.provider.cancel(entity.providerInvoiceId, reason);
    } catch (error) {
      result = {
        status: "REJECTED" as const,
        cancelReason:
          error instanceof Error
            ? `Falha inesperada ao cancelar: ${error.message}`
            : "Falha inesperada ao cancelar a nota fiscal.",
      };
    }
    await this.invoices.updateById(invoiceId, {
      status: result.status,
      cancelReason: result.cancelReason ?? reason,
      canceledAt: result.status === "CANCELED" ? new Date() : null,
      rawResponse: result.raw ?? entity.rawResponse,
    });
    return toInvoice(await this.invoices.findByIdOrFail(invoiceId));
  }

  /**
   * Reconsulta o provedor e atualiza uma nota ainda em processamento (escopada
   * ao tenant — chamada de uma rota autenticada). Emissão de NF-e/NFC-e é
   * assíncrona; isto é o fallback do webhook (botão "Atualizar status").
   */
  async refreshStatus(invoiceId: string): Promise<Invoice> {
    const entity = await this.invoices.findByIdOrFail(invoiceId);
    if (entity.status !== "PROCESSING" || !entity.providerInvoiceId) {
      return toInvoice(entity);
    }
    const result = await this.provider.checkStatus(entity.providerInvoiceId);
    await this.invoices.updateById(invoiceId, this.statusFields(result));
    return toInvoice(await this.invoices.findByIdOrFail(invoiceId));
  }

  /**
   * Aplica o status a partir do webhook do provedor (SEM tenant no contexto).
   * O `ref` é o id da nota; reconsulta o provedor pra ter o dado autoritativo.
   */
  async applyStatusByRef(ref: string): Promise<void> {
    const entity = await this.invoices.findByIdUnscoped(ref);
    if (!entity || entity.status !== "PROCESSING") return;
    const result = await this.provider.checkStatus(ref);
    await this.invoices.updateByIdUnscoped(ref, this.statusFields(result));
  }

  private statusFields(result: {
    status: Invoice["status"];
    accessKey?: string | null;
    protocol?: string | null;
    xmlUrl?: string | null;
    danfeUrl?: string | null;
    rejectionReason?: string | null;
  }): Partial<InvoiceEntity> {
    return {
      status: result.status,
      accessKey: result.accessKey ?? null,
      protocol: result.protocol ?? null,
      xmlUrl: result.xmlUrl ?? null,
      danfeUrl: result.danfeUrl ?? null,
      rejectionReason: result.rejectionReason ?? null,
      issueDate: result.status === "AUTHORIZED" ? new Date() : null,
    };
  }

  async latestForEvent(eventId: string): Promise<Invoice | null> {
    const entity = await this.invoices.latestForEvent(eventId);
    return entity ? toInvoice(entity) : null;
  }

  async historyForEvent(eventId: string): Promise<Invoice[]> {
    const entities = await this.invoices.listForEvent(eventId);
    return entities.map(toInvoice);
  }

  hasAny(eventId: string): Promise<boolean> {
    return this.invoices.hasAny(eventId);
  }
}
