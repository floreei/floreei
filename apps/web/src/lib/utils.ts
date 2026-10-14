import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes condicionais resolvendo conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata um valor numérico como moeda brasileira (BRL). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata um número como percentual com 1 casa decimal (ex.: 42,5%). */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/** Data de hoje no fuso local, no formato "AAAA-MM-DD" (para <input type="date">). */
export function todayLocalISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Intervalo do mês atual (1º dia → hoje) no formato "AAAA-MM-DD". Casa com a
 * preset "Este mês" de `sales-filters.tsx` para ela ficar marcada por padrão.
 */
export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  // Vai até o ÚLTIMO dia do mês (não "hoje") — inclui registros com data futura
  // ainda dentro do mês (ex.: uma venda agendada para o dia 20).
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${pad(lastDay)}` };
}

/** "AAAA-MM-DD" → Date no fuso local (sem deslocamento de UTC). */
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // Numérico e compacto (padrão brasileiro), melhor para tabelas: 02/07/2026.
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseLocalDate(value));
}

/**
 * "14/10/2026 às 15:07" — instante ISO (com fuso, ex.: created_at do banco)
 * mostrado como data e hora no fuso local. Para carimbos do sistema, não para
 * datas de negócio ("AAAA-MM-DD"), que usam `formatDate`.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${day} às ${time}`;
}

/**
 * "qua 14/10" — dia da semana abreviado + dia/mês, para listas por dia. O Intl
 * pt-BR abrevia com ponto ("qua."), que sai para ficar mais limpo.
 */
export function formatWeekdayShort(value: string): string {
  const date = parseLocalDate(value);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `${weekday} ${dayMonth}`;
}

/** "quarta-feira, 14/10/2026" — por extenso, para cabeçalhos de dia. */
export function formatDateWithWeekday(value: string): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(
    parseLocalDate(value),
  );
  return `${weekday}, ${formatDate(value)}`;
}

/** Formata uma chave "AAAA-MM" como "set/26". */
export function formatMonthShort(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}
