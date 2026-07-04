export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ação destrutiva — botão vermelho. */
  destructive?: boolean;
  loading?: boolean;
}
/** Diálogo de confirmação (rodapé não-sticky, texto sempre visível). */
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;
