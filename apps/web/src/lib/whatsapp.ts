import { formatCurrency } from "./utils";

/**
 * Monta um link `wa.me` com o texto pré-preenchido. Assume DDI 55 (Brasil)
 * quando o número não traz código do país. Retorna null se não houver telefone
 * utilizável — o chamador desabilita a ação nesse caso.
 */
export function whatsappHref(
  phone: string | null | undefined,
  text: string,
): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

const fmtQty = (q: number): string =>
  Number.isInteger(q) ? String(q) : q.toFixed(3).replace(/\.?0+$/, "").replace(".", ",");

interface OrderLine {
  name: string;
  quantity: number;
  lineTotal: number;
}

/** Texto de um pedido individual (venda ou compra) para enviar no WhatsApp. */
export function buildOrderMessage(opts: {
  company: string;
  heading: string;
  dateLabel?: string;
  items: OrderLine[];
  total: number;
  paid?: number;
  balance?: number;
  closing?: string;
}): string {
  const lines: string[] = [`*${opts.company} — ${opts.heading}*`];
  if (opts.dateLabel) lines.push(opts.dateLabel);
  lines.push("");
  if (opts.items.length > 0) {
    for (const it of opts.items) {
      lines.push(`• ${fmtQty(it.quantity)}x ${it.name} — ${formatCurrency(it.lineTotal)}`);
    }
  } else {
    lines.push(`• ${opts.heading}`);
  }
  lines.push("", `Total: ${formatCurrency(opts.total)}`);
  if (opts.paid && opts.paid > 0) lines.push(`Pago: ${formatCurrency(opts.paid)}`);
  if (opts.balance && opts.balance > 0)
    lines.push(`Em aberto: ${formatCurrency(opts.balance)}`);
  if (opts.closing) lines.push("", opts.closing);
  return lines.join("\n");
}

/** Texto de resumo (extrato) de um cliente ou fornecedor. */
export function buildStatementMessage(opts: {
  company: string;
  name: string;
  countLabel: string;
  totalLabel: string;
  total: number;
  balanceLabel: string;
  balance: number;
  closing?: string;
}): string {
  const lines = [
    `*${opts.company} — Resumo de ${opts.name}*`,
    "",
    opts.countLabel,
    `${opts.totalLabel}: ${formatCurrency(opts.total)}`,
  ];
  if (opts.balance > 0)
    lines.push(`${opts.balanceLabel}: ${formatCurrency(opts.balance)}`);
  if (opts.closing) lines.push("", opts.closing);
  return lines.join("\n");
}
