import { ReactNode, CSSProperties } from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Esconde a coluna abaixo do breakpoint (mobile). */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Números tabulares (valores financeiros). */
  tabular?: boolean;
  render?: (row: T) => ReactNode;
}
/**
 * Tabela densa e responsiva — esconde colunas secundárias no mobile.
 * @startingPoint section="Dados" subtitle="Tabela densa e responsiva" viewport="700x260"
 */
export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: string;
  onRowClick?: (row: T) => void;
  /** Conteúdo quando data está vazio (ex.: <EmptyState/>). */
  empty?: ReactNode;
  style?: CSSProperties;
}
export function Table<T = any>(props: TableProps<T>): JSX.Element;
