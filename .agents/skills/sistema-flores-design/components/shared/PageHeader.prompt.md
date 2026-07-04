`PageHeader` — cabeçalho de página com título **serif** (Fraunces ~32px) + descrição + ações. É a hierarquia de topo (serif p/ página; sans p/ seções internas).

```jsx
<PageHeader
  title="Contas a receber"
  description="Acompanhe recebimentos e vencimentos do mês."
  actions={<Button leftIcon={<Plus size={18} />}>Nova conta</Button>}
/>
```
