import { ReactNode } from 'react';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right';
  width?: number;
}
/** Painel deslizante lateral (filtros, detalhes). Título em sans. */
export function Sheet(props: SheetProps): JSX.Element | null;
