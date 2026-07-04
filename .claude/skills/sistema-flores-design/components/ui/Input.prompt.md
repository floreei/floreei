`Input` — campo de texto de linha única, altura 44px, foco com anel duplo e estado de erro.

```jsx
<Input placeholder="Nome do cliente" />
<Input inputMode="numeric" selectOnFocus rightAddon={<span>un.</span>} />
<Input error placeholder="Campo inválido" />
```

Prefira usar dentro de `Field` (rótulo + hint + erro). Use `leftAddon`/`rightAddon` para prefixos como "R$" ou ícones lucide.
