import { ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Título — renderizado em serif (Fraunces). */
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Rodapé de ações (ex.: Cancelar + Salvar). */
  footer?: ReactNode;
  /** Rodapé fixo — true p/ forms simples, false p/ conteúdo crítico. @default true */
  stickyFooter?: boolean;
  width?: number;
}
/** Modal centralizado, max-height 90dvh, scroll interno, título serif. */
export function Dialog(props: DialogProps): JSX.Element | null;
