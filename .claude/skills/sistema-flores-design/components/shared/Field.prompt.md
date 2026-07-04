`Field` — envelope de campo: rótulo (com `*`/`(opcional)`) + controle + hint/erro. Injeta `id` e `error` no controle filho automaticamente. Altura de rótulo fixa alinha campos em grades multi-coluna.

```jsx
<Field label="Cliente" required hint="Nome completo">
  <Input placeholder="Ex.: Maria Silva" />
</Field>
<Field label="Valor" required error="Informe um valor maior que zero">
  <CurrencyInput />
</Field>
```
