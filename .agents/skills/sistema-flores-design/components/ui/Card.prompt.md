`Card` — superfície branca flutuante (sombra em camadas). Compõe com `CardHeader`, `CardBody`, `CardFooter`.

```jsx
<Card>
  <CardHeader title="Resumo do mês" description="Junho de 2026" action={<Button variant="ghost" size="sm">Ver tudo</Button>} />
  <CardBody>…</CardBody>
  <CardFooter><Button>Salvar</Button></CardFooter>
</Card>
```

Título de card é **sans semibold** (hierarquia: serif p/ página, sans p/ seção). Profundidade vem da sombra, não da borda.
