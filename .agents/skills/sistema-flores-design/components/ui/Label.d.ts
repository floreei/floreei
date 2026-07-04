import { ReactNode, CSSProperties } from 'react';

export interface LabelProps {
  htmlFor?: string;
  /** Marca `*` vermelho de obrigatório. */
  required?: boolean;
  /** Marca `(opcional)` cinza. Ignorado se `required`. */
  optional?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

/** Rótulo de campo. Nunca marque required e optional ao mesmo tempo. */
export function Label(props: LabelProps): JSX.Element;
