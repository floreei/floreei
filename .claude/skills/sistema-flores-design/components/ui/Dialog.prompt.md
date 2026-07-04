`Dialog` — modal centralizado com overlay, título **serif**, max-height 90dvh e scroll interno.

```jsx
<Dialog open={open} onClose={close}
  title="Novo orçamento" description="Preencha os dados do cliente"
  footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button>Salvar</Button></>}>
  <Field label="Cliente" required><Input /></Field>
</Dialog>
```

`stickyFooter` padrão true (forms simples). Em conteúdo crítico, passe `stickyFooter={false}` para não esconder controles.
