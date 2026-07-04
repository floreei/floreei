export interface CurrencyInputProps {
  /** Valor controlado em centavos (ex.: 123456 = R$ 1.234,56). */
  value?: number;
  /** Valor inicial em centavos (não-controlado). @default 0 */
  defaultValue?: number;
  /** Recebe o novo valor em centavos. */
  onValueChange?: (cents: number) => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/** Campo de moeda BRL com prefixo "R$" e acumulador de centavos. */
export function CurrencyInput(props: CurrencyInputProps): JSX.Element;
