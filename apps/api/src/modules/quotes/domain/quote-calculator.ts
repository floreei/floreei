/**
 * A lógica de cálculo de orçamento vive em `@sistema-flores/types` para ser a
 * mesma no backend e no frontend (cálculo ao vivo). Este módulo apenas reexporta
 * para manter as importações internas do backend estáveis.
 */
export {
  calculateItem,
  calculateQuote,
  marginPercent,
  type QuoteItemAmounts,
  type QuoteItemTotals,
  type QuoteTotals,
} from "@sistema-flores/types";
