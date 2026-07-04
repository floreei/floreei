`StatusBadge` — pill de status de negócio do ERP, com ponto indicador e rótulo pt-BR automático.

```jsx
<StatusBadge status="pago" />        // • Pago (verde)
<StatusBadge status="pendente" />    // • Pendente (âmbar)
<StatusBadge status="atrasado" />    // • Atrasado (vermelho)
```

Status conhecidos: `pago`, `recebido`, `pendente`, `atrasado`, `vencido`, `rascunho`, `aprovado`, `cancelado`, `em_andamento`. Use `label` para sobrescrever o texto.
