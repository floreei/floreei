import type { DunningSettings } from "@sistema-flores/types";

export interface ReminderContent {
  companyName: string;
  customerName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  offsetDays: number;
  /** Link da página pública da cobrança (fatura salvável em PDF). */
  link?: string;
  /**
   * Inclui o rodapé de descadastro. Só faz sentido no disparo AUTOMÁTICO (canal
   * oficial); no envio manual, quem manda é o próprio WhatsApp do lojista.
   */
  optOut?: boolean;
}

const brl = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dateBR = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

/**
 * Monta o texto do lembrete de cobrança. Sem emojis e com frases completas por
 * linha de propósito: o campo pré-preenchido do WhatsApp Web não renderiza
 * quebras (%0A) nem emojis fora do BMP, então a mensagem precisa ler bem mesmo
 * "achatada" numa linha só. O visual caprichado mora na página pública (`link`).
 */
export function buildDunningMessage(
  r: ReminderContent,
  s: DunningSettings,
): string {
  const venc = dateBR(r.dueDate);
  const valor = brl(r.amount);
  const lines: string[] = [`Olá, ${r.customerName}! Tudo bem?`, ""];

  const inicio = `Identificamos um pagamento em aberto da sua compra na ${r.companyName}, no valor de ${valor}`;
  if (r.offsetDays < 0) {
    lines.push(`${inicio}, com vencimento em ${venc}.`);
  } else if (r.offsetDays === 0) {
    lines.push(`${inicio}, que vence hoje (${venc}).`);
  } else {
    lines.push(`${inicio}, que venceu em ${venc}.`);
  }

  if (r.link) {
    lines.push("", `Veja os detalhes e o comprovante aqui: ${r.link}`);
  }

  if (s.paymentMethod === "PIX" && s.pixKey) {
    lines.push("", `Se preferir, o PIX (copia e cola) é: ${s.pixKey}`);
  } else if (s.paymentMethod === "MP_LINK" && s.mpLink) {
    lines.push("", `Para pagar pelo Mercado Pago: ${s.mpLink}`);
  }

  if (s.extraLine) lines.push("", s.extraLine);

  if (r.optOut) {
    // Disparo automático: deixa claro que é automático e como sair.
    lines.push(
      "",
      "Se você já realizou o pagamento, pode desconsiderar esta mensagem — trata-se de uma cobrança automática.",
      "",
      "Responda SAIR para não receber estes lembretes.",
    );
  } else {
    // Envio manual (WhatsApp do próprio lojista).
    lines.push(
      "",
      "Se já tiver realizado o pagamento, é só desconsiderar. Qualquer dúvida, estou à disposição. Obrigado!",
    );
  }

  return lines.join("\n");
}
