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
