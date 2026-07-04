`Select` — seleção sobre `<select>` nativo (acessível a teclado e leitores de tela), com chevron lucide.

```jsx
<Select placeholder="Selecione o status" options={[
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
]} />
```

Prefira o nativo à custom-dropdown pelo público idoso/leigo.
