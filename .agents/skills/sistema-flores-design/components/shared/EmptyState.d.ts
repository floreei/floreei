import { ReactNode, CSSProperties } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Ação primária (ex.: "Criar orçamento"). */
  action?: ReactNode;
  style?: CSSProperties;
}
/** Estado vazio com ícone circular, título, texto e ação. */
export function EmptyState(props: EmptyStateProps): JSX.Element;
