# Insights filtráveis, entregas pendentes e persistência de filtros

**Data:** 2026-08-12
**Telas:** `/vendas` e `/atacado` (apps/web) · endpoint `/events` e `/events/insights` (apps/api)

## Problema

1. O painel "Insights do período" só reage a período e canal — ignora os demais
   filtros da tela (pagamento, entrega, busca, tipo).
2. Não há visão consolidada de **quantas flores faltam entregar e a quem**: o
   usuário abre venda por venda para somar quantidades por cliente.
3. Na listagem do atacado não dá para ver os itens (produto × quantidade) sem
   abrir o detalhe.
4. Ao entrar no detalhe de uma venda e voltar, os filtros aplicados somem — o
   estado vive em `useState` e a navegação das linhas usa `window.location.href`
   (full reload).

## Decisões (validadas com o usuário)

- "Falta entregar" vira **seção no painel de insights** (não faixa fixa).
- Detalhamento de itens na listagem do atacado via **linha expansível**.
- Insights respeitam **todos os filtros da tela** onde a semântica é clara:
  "Mais vendidos", "Quem mais comprou" e "Falta entregar" aplicam pagamento,
  entrega, busca e tipo; "Parados" e "Clientes em risco" seguem só por
  período+canal (são definidos por ausência de vendas).
- Persistência de filtros via **URL query params** (não sessionStorage).

## Desenho

### 1. Persistência de filtros na URL

Em `/vendas` e `/atacado`:

- Estado dos filtros passa a ser derivado de `useSearchParams`; mudanças fazem
  `router.replace` com os params atualizados (`busca`, `pagamento`, `entrega`,
  `de`, `ate`, `pagina`, `tipo` — este só em /vendas — e `insights` para o
  painel aberto). Params ausentes usam os defaults atuais (mês corrente,
  página 1, painel fechado).
- Navegação das linhas da tabela troca `window.location.href = …` por
  `router.push(…)` (sem full reload).
- O "Voltar" do detalhe (`/vendas/[id]` e `/atacado/[id]`) usa `router.back()`
  quando a navegação veio de dentro do app, com fallback para o `backHref`
  atual (deep link/aba nova). Como os filtros estão na URL da lista, o back
  restaura tudo.

### 2. Insights responsivos aos filtros + "Falta entregar"

**Tipos (`packages/types`):**

- `insightsQuerySchema` ganha `paymentStatus`, `delivered`, `search`, `type`
  (mesmas validações do `eventQuerySchema`).
- Novo bloco em `SalesInsights`:

```ts
interface PendingDeliveryItem {
  id: string;            // produto ou buquê
  name: string;
  kind: "product" | "arrangement";
  quantity: number;
  unit: ProductUnit;     // MACO, HASTE, UN…
}
interface PendingDeliveryCustomer {
  id: string | null;     // null = venda sem cliente
  name: string;          // "Sem cliente" resolvido no front
  salesCount: number;
  items: PendingDeliveryItem[];
}
interface PendingDeliveries {
  salesCount: number;          // vendas a entregar no período
  totalQuantity: number;       // soma das quantidades (todas as unidades)
  customers: PendingDeliveryCustomer[]; // ordenado por quantidade desc
}
// SalesInsights ganha: pendingDeliveries: PendingDeliveries
```

**API (`SalesInsightsService`):**

- `generate()` recebe a query completa e repassa os filtros.
- `topItems`/`topCustomers` aplicam `paymentStatus` (paid/pending/overdue,
  mesmas cláusulas do `EventRepository.search`), `delivered`, `search`
  (título/cliente, ILIKE) e `type`.
- Novo `pendingDeliveries`: agrega `event_items` de eventos com
  `status IN ('CONFIRMED','IN_PROGRESS')` (não entregues, não cancelados) no
  período/canal, agrupando cliente × item (quantidade somada por unidade).
  Ignora o filtro `delivered` de propósito (a definição da seção já é "não
  entregue"); respeita `paymentStatus`, `search` e `type`. Vendas sem itens
  (valor livre) entram no `salesCount` do cliente, sem linhas de item.
- `idleItems`/`atRiskCustomers` inalterados.

**Web:**

- `useSalesInsights` passa a receber o objeto de filtros; query key inclui
  todos.
- `SalesInsightsPanel` recebe os filtros das páginas e ganha a seção
  **"Falta entregar"** (ícone Truck): linha-resumo ("X itens em Y entregas") e
  lista por cliente com o detalhamento produto × quantidade × unidade.
  Estado vazio: "Nada pendente de entrega no período."

### 3. Itens na listagem do atacado (linha expansível)

- **API:** `EventRepository.search()` ganha `leftJoinAndSelect("event.items", "items")`
  — o mapper já serializa `items`, hoje vazio na lista. Paginação via
  skip/take continua correta (TypeORM usa subquery de ids com join 1:N).
- **Desktop (`/atacado`):** célula com chevron no início da linha; clicar
  expande uma `TableRow` extra (colSpan) listando descrição, quantidade com
  unidade e total da linha de cada item. Clique no chevron não navega
  (stopPropagation).
- **Celular:** o cartão (`ListCard`) do atacado ganha um expansor "ver itens"
  com a mesma lista compacta.
- `/vendas` não ganha a linha expansível (fora do escopo pedido), mas o
  payload com itens fica disponível.

## Erros e casos-limite

- Venda sem cliente agrupa em "Sem cliente" no "Falta entregar".
- Venda de valor livre (sem itens) aparece no contador de entregas, sem itens.
- Unidades diferentes não se somam entre si no rótulo por item (cada item
  mantém sua unidade); o total geral soma quantidades e usa rótulo neutro
  ("itens").
- Params de URL inválidos (ex.: `pagamento=xyz`) caem nos defaults.

## Testes

- **API e2e (`apps/api`, Firebase real):** insights com filtros de pagamento/
  busca/entrega; `pendingDeliveries` com vendas entregues × pendentes, com e
  sem cliente, com e sem itens; isolamento multi-tenant preservado.
- **Unit (`packages/types`):** parse do `insightsQuerySchema` estendido.
- **Playwright (`apps/web`):** aplicar filtros no atacado → abrir detalhe →
  voltar → filtros e página preservados; expandir linha e ver itens.

## Fora do escopo

- Linha expansível em `/vendas`.
- Mudanças no fluxo de marcar entrega (DeliveryToggle) e na régua de cobrança.
