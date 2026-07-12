import type { SortOrder } from "@sistema-flores/types";

/**
 * Ordena um array em memória por uma chave (número ou texto). Usado nas tabelas
 * client-side (estoque, caixa). `sort` indefinido devolve a ordem original.
 */
export function sortRows<T>(
  rows: T[],
  sort: string | undefined,
  order: SortOrder | undefined,
  getters: Record<string, (row: T) => string | number | null | undefined>,
): T[] {
  const get = sort ? getters[sort] : undefined;
  if (!get) return rows;
  const dir = order === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av ?? "").localeCompare(String(bv ?? ""), "pt-BR") * dir;
  });
}
