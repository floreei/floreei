import { ReactNode, CSSProperties } from 'react';

export interface SelectOption { value: string; label: string; }

export interface SelectProps {
  error?: boolean;
  /** Lista de opções. Alternativa a passar <option> como children. */
  options?: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children?: ReactNode;
  style?: CSSProperties;
}

/** Seleção baseada em <select> nativo (acessível), com chevron lucide. */
export function Select(props: SelectProps): JSX.Element;
