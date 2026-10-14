/**
 * Mensagem curta que o lojista cola no WhatsApp junto com a nota em PDF. A
 * saudação segue a hora LOCAL de quem envia (por isso é montada no navegador,
 * não na API). Sem valor nem nome: a nota anexa e o link já trazem tudo.
 */

export type Greeting = "bom dia" | "boa tarde" | "boa noite";

/** Antes do meio-dia "bom dia", até as 18h "boa tarde", depois "boa noite". */
export function greetingFor(now: Date): Greeting {
  const hour = now.getHours();
  if (hour < 12) return "bom dia";
  if (hour < 18) return "boa tarde";
  return "boa noite";
}

/** "AAAA-MM-DD" → "DD/MM". */
function dayMonth(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function buildCobrancaText(opts: {
  /** Data da venda (AAAA-MM-DD). */
  saleDate: string;
  /** Link da página pública da cobrança. */
  link: string;
  now?: Date;
}): string {
  const greeting = greetingFor(opts.now ?? new Date());
  return [
    `Olá, ${greeting}! Tudo bem?`,
    "",
    `Passando para lhe encaminhar sua nota do pedido do dia ${dayMonth(opts.saleDate)}.`,
    `Segue o link da nota para pagamento: ${opts.link}`,
  ].join("\n");
}
