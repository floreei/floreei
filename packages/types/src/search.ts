import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export type SearchResultType =
  | "customer"
  | "event"
  | "quote"
  | "product"
  | "supplier"
  | "purchase";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  sublabel?: string;
  href: string;
}

export const searchTypeLabels: Record<SearchResultType, string> = {
  customer: "Clientes",
  event: "Eventos",
  quote: "Orçamentos",
  product: "Produtos",
  supplier: "Fornecedores",
  purchase: "Compras",
};
