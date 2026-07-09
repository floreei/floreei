import type {
  EventStatus,
  EventType,
  InvoiceDocumentType,
  InvoiceStatus,
  QuoteStatus,
  SalesChannel,
} from "@sistema-flores/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type Variant = BadgeProps["variant"];

const quoteMap: Record<QuoteStatus, { label: string; variant: Variant }> = {
  DRAFT: { label: "Rascunho", variant: "secondary" },
  SENT: { label: "Enviado", variant: "default" },
  APPROVED: { label: "Aprovado", variant: "success" },
  REJECTED: { label: "Recusado", variant: "destructive" },
  EXPIRED: { label: "Expirado", variant: "warning" },
  CANCELED: { label: "Cancelado", variant: "destructive" },
};

/** Status de ENTREGA da venda. */
const eventMap: Record<EventStatus, { label: string; variant: Variant }> = {
  CONFIRMED: { label: "A entregar", variant: "warning" },
  IN_PROGRESS: { label: "Em preparo", variant: "clay" },
  DONE: { label: "Entregue", variant: "success" },
  CANCELED: { label: "Cancelada", variant: "destructive" },
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { label, variant } = quoteMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { label, variant } = eventMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

/** Status de PAGAMENTO derivado do valor recebido vs vendido. */
export function PaymentStatusBadge({
  sold,
  received,
}: {
  sold: number;
  received: number;
}) {
  if (received <= 0) return <Badge variant="warning">A receber</Badge>;
  if (received + 0.001 < sold) return <Badge variant="clay">Parcial</Badge>;
  return <Badge variant="success">Pago</Badge>;
}

const typeMap: Record<EventType, { label: string; variant: Variant }> = {
  ORDER: { label: "Pedido", variant: "secondary" },
  EVENT: { label: "Evento", variant: "clay" },
};

export function EventTypeBadge({ type }: { type: EventType }) {
  const { label, variant } = typeMap[type];
  return <Badge variant={variant}>{label}</Badge>;
}

export const eventTypeLabel = (type: EventType) => typeMap[type].label;

const channelMap: Record<SalesChannel, { label: string; variant: Variant }> = {
  RETAIL: { label: "Varejo", variant: "default" },
  WHOLESALE: { label: "Atacado", variant: "clay" },
};

export function SalesChannelBadge({ channel }: { channel: SalesChannel }) {
  const { label, variant } = channelMap[channel];
  return <Badge variant={variant}>{label}</Badge>;
}

const invoiceStatusMap: Record<InvoiceStatus, { label: string; variant: Variant }> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  PROCESSING: { label: "Processando", variant: "warning" },
  AUTHORIZED: { label: "Autorizada", variant: "success" },
  REJECTED: { label: "Rejeitada", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "destructive" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, variant } = invoiceStatusMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const invoiceDocMap: Record<InvoiceDocumentType, { label: string; variant: Variant }> = {
  NFCE: { label: "NFC-e", variant: "default" },
  NFE: { label: "NF-e", variant: "clay" },
};

export function InvoiceDocumentTypeBadge({ type }: { type: InvoiceDocumentType }) {
  const { label, variant } = invoiceDocMap[type];
  return <Badge variant={variant}>{label}</Badge>;
}
