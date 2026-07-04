import { ReactNode, CSSProperties } from 'react';

/**
 * Envelope de campo de formulário (rótulo + controle + hint/erro).
 * @startingPoint section="Formulários" subtitle="Campo com rótulo, hint e erro" viewport="700x160"
 */
export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  /** Texto de ajuda abaixo do controle. */
  hint?: ReactNode;
  /** Mensagem de erro — substitui o hint e realça o controle. */
  error?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}
export function Field(props: FieldProps): JSX.Element;
