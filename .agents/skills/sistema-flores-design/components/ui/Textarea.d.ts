import { CSSProperties } from 'react';

export interface TextareaProps {
  error?: boolean;
  rows?: number;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: CSSProperties;
}

/** Campo de texto de múltiplas linhas (observações). */
export function Textarea(props: TextareaProps): JSX.Element;
