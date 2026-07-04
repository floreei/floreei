`Tabs` — abas em pílula sobre trilho `muted`; a aba ativa é um card branco com sombra.

```jsx
<Tabs defaultValue="receber" items={[
  { value: 'receber', label: 'A receber' },
  { value: 'pagar', label: 'A pagar' },
  { value: 'caixa', label: 'Caixa' },
]} onValueChange={setAba} />
```
