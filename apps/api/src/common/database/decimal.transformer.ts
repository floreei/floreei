import { ValueTransformer } from "typeorm";
import { roundMoney } from "../money/money";

/**
 * Converte colunas `decimal` (que o driver pg devolve como string) para `number`
 * e vice-versa, sempre arredondando para 2 casas. Mantém o banco como fonte de
 * verdade precisa (decimal) sem expor strings ao domínio.
 */
export const decimalTransformer: ValueTransformer = {
  to(value?: number | null): number | null | undefined {
    // undefined → deixa o default da coluna agir; null → grava NULL (colunas nullable).
    if (value === undefined) return undefined;
    if (value === null) return null;
    return roundMoney(value);
  },
  from(value?: string | null): number | null {
    if (value === null || value === undefined) return null;
    return roundMoney(Number(value));
  },
};

/**
 * Transformer para quantidades (até 3 casas decimais — ex.: 1.5 maços).
 */
export const quantityTransformer: ValueTransformer = {
  to(value?: number | null): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return value;
  },
  from(value?: string | null): number | null {
    if (value === null || value === undefined) return null;
    return Number(value);
  },
};
