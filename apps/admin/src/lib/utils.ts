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
    maximumFractionDigits: value >= 10_000 ? 0 : 2,
  }).format(value);
}

/** Formata um inteiro com separador de milhar (pt-BR). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** Formata uma data ISO como "02/07/2026"; "—" quando ausente. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Descreve, em pt-BR, quando foi o último acesso a partir dos dias de inatividade.
 * `null` = nunca acessou.
 */
export function describeInactivity(days: number | null): string {
  if (days === null) return "Nunca acessou";
  if (days === 0) return "Acessou hoje";
  if (days === 1) return "Ontem";
  return `Há ${days} dias`;
}
