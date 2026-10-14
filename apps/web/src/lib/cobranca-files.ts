/** Nomes dos arquivos exportados da cobrança (PDF por venda e ZIP do lote). O cliente vê "Nota", não "Cobrança". */

/** Tira acentos e tudo que não é letra, número, espaço ou hífen; colapsa espaços. */
function safeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "2026-10-15" → "15-10-2026" (barra não pode em nome de arquivo). */
function fileDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

/**
 * "Nota - Mercado Flor - 15-10-2026.pdf" — cliente e data de entrega combinada
 * (ou a data da venda, quando não há entrega marcada). Sem id do pedido: é
 * assim que o lojista procura a nota depois. Cliente curto o bastante para
 * qualquer sistema de arquivos.
 */
export function cobrancaFileName(doc: {
  customerName: string;
  date: string;
  deliveryDate: string | null;
}): string {
  const customer = safeName(doc.customerName).slice(0, 60).trim() || "Cliente";
  return `Nota - ${customer} - ${fileDate(doc.deliveryDate ?? doc.date)}.pdf`;
}

/** "Notas atacado - 2026-10-01 a 2026-10-31.zip" (ou só a data de hoje sem período). */
export function cobrancasZipName(from: string, to: string, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const period = from && to ? `${from} a ${to}` : today;
  return `Notas atacado - ${period}.zip`;
}
