import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import type { SortOrder } from "@sistema-flores/types";

/** Ordenação padrão (coluna SQL + direção) quando não vem `sort` na query. */
interface SortDefault {
  column: string;
  direction: "ASC" | "DESC";
}

/**
 * Aplica ordenação a um QueryBuilder de forma segura: `sort` é uma chave pública
 * validada contra `columnMap` (whitelist → coluna SQL), evitando SQL injection.
 * Sem `sort` válido, cai no `def` (mantém a ordem atual da listagem).
 */
export function applySort<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  sort: string | undefined,
  order: SortOrder | undefined,
  columnMap: Record<string, string>,
  def: SortDefault,
): SelectQueryBuilder<T> {
  const column = (sort && columnMap[sort]) || def.column;
  const direction = order ? (order === "asc" ? "ASC" : "DESC") : def.direction;
  return qb.orderBy(column, direction);
}
