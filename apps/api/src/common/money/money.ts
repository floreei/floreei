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
