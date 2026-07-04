`Label` — rótulo de campo com marcador `*` (obrigatório) ou `(opcional)`. `leading-none` mantém alinhamento em grades de formulário.

```jsx
<Label htmlFor="cliente" required>Cliente</Label>
<Label htmlFor="obs" optional>Observações</Label>
```

Nunca use `required` e `optional` juntos.
