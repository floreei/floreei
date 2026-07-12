import type { DunningSettings } from "@sistema-flores/types";

export interface ReminderContent {
  companyName: string;
  customerName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  offsetDays: number;
}

const brl = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dateBR = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

/** Monta o texto do lembrete a partir do passo e da config de pagamento. */
export function buildDunningMessage(
  r: ReminderContent,
  s: DunningSettings,
): string {
  const venc = dateBR(r.dueDate);
  const lines: string[] = [`Olá, ${r.customerName}! 🌸`, ""];

  if (r.offsetDays < 0) {
    lines.push(
      `Passando pra lembrar da sua compra na ${r.companyName}: ${brl(r.amount)}, com vencimento em ${venc}.`,
    );
  } else if (r.offsetDays === 0) {
    lines.push(
      `Sua compra na ${r.companyName} de ${brl(r.amount)} vence hoje (${venc}).`,
    );
  } else {
    lines.push(
      `Sua compra na ${r.companyName} de ${brl(r.amount)} venceu em ${venc}. Consegue acertar?`,
    );
  }

  if (s.paymentMethod === "PIX" && s.pixKey) {
    lines.push("", `Pra facilitar, o PIX é: ${s.pixKey}`);
  } else if (s.paymentMethod === "MP_LINK" && s.mpLink) {
    lines.push("", `Você pode pagar por aqui: ${s.mpLink}`);
  }

  if (s.extraLine) lines.push("", s.extraLine);

  lines.push("", "_Responda SAIR para não receber estes lembretes._");
  return lines.join("\n");
}
