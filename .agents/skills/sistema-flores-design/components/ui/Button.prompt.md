`Button` — ação clicável do Sistema Flores; use `primary` para a ação principal, `clay` para ênfase, `destructive` para exclusões, `ghost`/`outline` para secundárias.

```jsx
<Button variant="primary" size="md" leftIcon={<Plus size={18} />}>
  Novo orçamento
</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="destructive" loading>Excluindo…</Button>
```

Variantes: `primary` · `secondary` · `ghost` · `outline` · `clay` · `destructive`. Tamanhos: `sm` (36px) · `md` (44px) · `lg` (48px). `loading` mostra spinner e desabilita. Alvos ≥ 44px por padrão (público idoso/leigo).
