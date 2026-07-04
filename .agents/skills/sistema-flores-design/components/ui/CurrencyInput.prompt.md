`CurrencyInput` — entrada monetária BRL com prefixo "R$" e acumulador de centavos (digita dígitos → formata R$ 0,00 da direita p/ esquerda). Valor sempre em **centavos**.

```jsx
<CurrencyInput defaultValue={123456} onValueChange={(cents) => setPreco(cents)} />
// exibe: R$ 1.234,56
```

`inputMode="numeric"`, `tabular-nums`, alinhado à direita.
