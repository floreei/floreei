`Table` — tabela densa e responsiva. Colunas com `hideBelow` somem no mobile, mantendo o essencial (nome + valor + ação). Use `tabular` em colunas de valor.

```jsx
<Table
  columns={[
    { key: 'cliente', header: 'Cliente' },
    { key: 'data', header: 'Vencimento', hideBelow: 'sm' },
    { key: 'valor', header: 'Valor', align: 'right', tabular: true },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]}
  data={contas}
  empty={<EmptyState title="Nenhuma conta" />}
/>
```
