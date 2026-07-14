// Formatação de moeda idêntica à referência: R$ 1.234,56 (vírgula decimal).
// Obs.: a referência usa v.toFixed(2).replace('.', ','), sem separador de milhar.
export const money = (v: number): string =>
  "R$ " + v.toFixed(2).replace(".", ",");
