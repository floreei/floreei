`Sheet` — painel deslizante lateral para filtros ou detalhes.

```jsx
<Sheet open={open} onClose={close} side="right" title="Filtros"
  footer={<Button fullWidth onClick={apply}>Aplicar</Button>}>
  …controles…
</Sheet>
```

Título em **sans** (contexto de ferramenta), diferente do Dialog (serif).
