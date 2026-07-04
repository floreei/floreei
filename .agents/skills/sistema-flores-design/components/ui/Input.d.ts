import { ReactNode, CSSProperties } from 'react';

export interface InputProps {
  error?: boolean;
  /** Afixo/ícone à esquerda (ex.: "R$", lupa). */
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  /** Teclado móvel: use 'numeric'/'decimal' em campos de valor. */
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'search';
  /** Seleciona o conteúdo ao focar (útil em números). */
  selectOnFocus?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: CSSProperties;
}

/** Campo de texto de linha única. Prefira usá-lo dentro de `Field`. */
export function Input(props: InputProps): JSX.Element;
