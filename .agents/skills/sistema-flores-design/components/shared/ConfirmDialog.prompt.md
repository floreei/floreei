`ConfirmDialog` — confirmação de ação, tipicamente destrutiva. Rodapé não-sticky (texto crítico sempre visível).

```jsx
<ConfirmDialog
  open={open} onClose={close} onConfirm={remove}
  title="Excluir este cliente?"
  description="Esta ação não pode ser desfeita."
  confirmLabel="Excluir" destructive loading={saving}
/>
```
