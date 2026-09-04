/**
 * Utilitários de dinheiro. Valores monetários são tratados como números em reais
 * com precisão de centavos. Toda operação arredonda para 2 casas para evitar
 * acúmulo de erro de ponto flutuante.
 */

/** Arredonda um valor para 2 casas decimais (centavos). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Soma uma lista de valores monetários arredondando o resultado. */
export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + v, 0));
}

/** Divide o lucro entre N pessoas: parte do dono arredondada; o resto (centavos) fica com os sócios. */
export function splitProfit(
  lineProfit: number,
  shares: number,
): { mine: number; partners: number } {
  const mine = roundMoney(lineProfit / shares);
  return { mine, partners: roundMoney(lineProfit - mine) };
}

/** Uma linha da venda para efeito de rateio do lucro de cabeçalho. */
export interface ProfitShareLine {
  lineCost: number;
  lineTotal: number;
  profitShares: number;
}

/**
 * Distribui um lucro de cabeçalho pelas linhas (peso = custo da linha; se todos
 * zerados, peso = total da linha; se ainda zerados, igual) e divide cada parcela
 * pelo N da linha. Devolve a parte dos sócios.
 */
export function partnersShareFor(
  estimatedProfit: number,
  lines: ProfitShareLine[],
): number {
  if (lines.length === 0) return 0;
  let weights = lines.map((l) => Math.max(0, l.lineCost));
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    weights = lines.map((l) => Math.max(0, l.lineTotal));
    totalWeight = weights.reduce((a, b) => a + b, 0);
  }
  if (totalWeight <= 0) {
    weights = lines.map(() => 1);
    totalWeight = lines.length;
  }
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    const parcel = (estimatedProfit * weights[i]) / totalWeight;
    const shares = Math.max(1, Math.trunc(lines[i].profitShares || 1));
    acc += splitProfit(roundMoney(parcel), shares).partners;
  }
  return roundMoney(acc);
}
