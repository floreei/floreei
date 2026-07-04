/** Arredonda um valor para 2 casas decimais (centavos). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Soma uma lista de valores monetários arredondando o resultado. */
export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + v, 0));
}

export interface QuoteItemAmounts {
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface QuoteItemTotals {
  lineCost: number;
  lineSale: number;
  lineProfit: number;
  marginPct: number;
}

export interface QuoteTotals {
  totalCost: number;
  totalSale: number;
  totalProfit: number;
  marginPct: number;
}

/** Margem percentual sobre a venda (0 quando a venda é zero). */
export function marginPercent(profit: number, sale: number): number {
  if (sale <= 0) return 0;
  return roundMoney((profit / sale) * 100);
}

/** Calcula custo, venda, lucro e margem de um item do orçamento. */
export function calculateItem(input: QuoteItemAmounts): QuoteItemTotals {
  const lineCost = roundMoney(input.quantity * input.purchasePrice);
  const lineSale = roundMoney(input.quantity * input.salePrice);
  const lineProfit = roundMoney(lineSale - lineCost);
  return {
    lineCost,
    lineSale,
    lineProfit,
    marginPct: marginPercent(lineProfit, lineSale),
  };
}

/** Soma os itens e devolve os totais do orçamento. */
export function calculateQuote(items: QuoteItemAmounts[]): QuoteTotals {
  const computed = items.map(calculateItem);
  const totalCost = sumMoney(computed.map((i) => i.lineCost));
  const totalSale = sumMoney(computed.map((i) => i.lineSale));
  const totalProfit = roundMoney(totalSale - totalCost);
  return {
    totalCost,
    totalSale,
    totalProfit,
    marginPct: marginPercent(totalProfit, totalSale),
  };
}
