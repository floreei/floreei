import type { Paginated } from "@sistema-flores/types";
import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";

/** Executa um QueryBuilder paginado e devolve o envelope padrão. */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  page: number,
  pageSize: number,
): Promise<Paginated<T>> {
  const [data, total] = await qb
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();

  return {
    data,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
