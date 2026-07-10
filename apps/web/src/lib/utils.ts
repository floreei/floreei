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

/** Formata uma data "AAAA-MM-DD" como "20 de set. de 2026". */
/** Data de hoje no fuso local, no formato "AAAA-MM-DD" (para <input type="date">). */
export function todayLocalISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  // Numérico e compacto (padrão brasileiro), melhor para tabelas: 02/07/2026.
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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
