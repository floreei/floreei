import React from 'react';
import { Dialog } from '../ui/Dialog.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * ConfirmDialog — confirmação de ação (geralmente destrutiva).
 * Rodapé NÃO-sticky para não esconder o texto crítico.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmar ação', description,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, loading = false }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} stickyFooter={false} width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? 'destructive' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
