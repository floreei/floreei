# SPECS — Fluxos de risco (cruzamentos entre features)

> **Para a IA e para devs:** antes de mexer em **recebimento/pagamento, estoque,
> cancelamento, orçamento→venda ou qualquer query com dados de empresa (tenant)**,
> leia o fluxo correspondente aqui. Este arquivo NÃO documenta cada módulo — ele
> mapeia só os **cruzamentos entre features** e os **invariantes que não podem
> quebrar**. Cada fluxo aponta o **teste e2e que o trava**: se mudar o fluxo,
> rode/atualize esse teste.
>
> Regra de manutenção: documentar **invariante + acoplamento + gotcha + teste** —
> nunca reconto do que o código já mostra (isso apodrece). Se uma referência aqui
> não bater com o código, o código vence; conserte esta linha.

## Mapa de domínios (orientação)

Backend em `apps/api/src/modules/*` (padrão por módulo:
`domain/ application/ infrastructure/ presentation`):

- **auth / users** — login JWT, cadastro de empresa, RBAC (ADMIN/…).
- **companies** — dados da floricultura (nome, CNPJ, logo) que saem na nota.
- **customers / customer-profile** — clientes (perfil = leitura agregada).
- **suppliers / supplier-profile** — fornecedores.
- **catalog** — categorias e produtos (preços padrão de compra/venda).
- **quotes** — orçamentos (cálculo de custo/venda/lucro/margem).
- **events** — **vendas** (tipo `ORDER` = pedido/balcão, `EVENT` = decoração).
- **purchases** — compras a fornecedor.
- **stock** — movimentos de estoque (fonte de verdade do saldo).
- **finance** — a receber/a pagar (derivados), recebimentos/pagamentos (ledger
  `payments`), Caixa (cashflow), DRE.
- **expenses** — despesas operacionais.
- **reports / dashboard / search** — leituras agregadas.

Cross-cutting em `apps/api/src/common/*`: `tenant/`, `database/` (repo scoped,
transformers), `money/`, `date/`.

Contratos compartilhados (back **e** front) em `packages/types/src/*`.

---

## Fluxo 1 — Multi-tenancy (invariante universal)

**Invariante:** toda tabela de tenant tem `company_id`, e **nenhuma leitura/escrita
pode vazar entre empresas**. Todo repositório de domínio herda o filtro; ninguém
consulta a tabela crua sem o escopo.

**Sequência:**
1. `JwtAuthGuard` popula `req.user` (inclui `companyId`).
2. `TenantContextInterceptor` (`apps/api/src/common/tenant/tenant-context.interceptor.ts`)
   abre o `AsyncLocalStorage` via `tenant.run({ companyId, userId, role }, …)`.
3. `TenantScopedRepository` (`apps/api/src/common/database/tenant-scoped.repository.ts`)
   injeta `companyId` em **toda** operação: `create()` carimba, `findAll/findByIdOrFail/
   count` passam por `scopedWhere()`, e `qb(alias)` já adiciona
   `WHERE alias.company_id = :companyId`.
4. `TenantSubscriber` (`.../tenant/tenant.subscriber.ts`) preenche `companyId` no
   `beforeInsert` como rede de segurança.

**Cruzamentos & acoplamento:** todo módulo de domínio depende disso implicitamente.
Se você escrever um `SelectQueryBuilder` novo, **use `this.<repo>.qb(alias)`** (já
escopado) — nunca `dataSource.createQueryBuilder` cru.

**Gotchas:**
- Consultas por **query builder cru** furam o isolamento — sempre `qb()` do scoped repo.
- Fora de um request (seed, migration), não há contexto; use os caminhos que setam
  `companyId` explicitamente.

**Testes que travam:** `apps/api/test/tenant-isolation.e2e-spec.ts` (e o `beforeEach`
de quase todos os specs cria uma empresa isolada).

---

## Fluxo 2 — Money loop (a receber / a pagar → recebimento/pagamento → Caixa/DRE)

**Invariante:** "a receber" e "a pagar" são **derivados**, não um ledger. O dinheiro
que efetivamente entrou/saiu vive na tabela **`payments`** (IN/OUT) + **`expenses`**.
Caixa e DRE são **projeções** desses dois — nunca recomputados de outra fonte.

**Sequência (entrada):**
1. Uma venda é um `Event` com `soldValue` e `receivedValue`.
2. **A receber** = `FinanceService.receivables()`
   (`apps/api/src/modules/finance/application/finance.service.ts`): eventos com
   `status <> 'CANCELED'` **e** `sold_value > received_value`;
   `balanceDue = soldValue − receivedValue`.
3. **Recebimento** = `PaymentsService.receiveForEvent()`
   (`.../finance/application/payments.service.ts`): valida `amount ≤ saldo`, grava um
   `Payment` `IN` (com `eventId`) **e** atualiza `event.receivedValue`.
4. **Desfazer recebimento** (baixa errada) = `PaymentsService.removeEventPayment()`
   (`DELETE /finance/events/:eventId/payments/:paymentId`): apaga o `Payment` **e**
   decrementa `event.receivedValue`. Simétrico: `removePurchasePayment()` para compras.
   Como o Caixa é projeção de `payments`, ele se corrige sozinho — nunca "estorne" um
   pagamento criando outro lançamento manual.
5. **Caixa** = `CashflowService.cashflow()`
   (`.../finance/application/cashflow.service.ts`): consolida `payments` IN/OUT +
   `expenses` num extrato com totais. **DRE** = `DreService.generate()`.

**Sequência (saída):** compra (Fluxo 3) gera "a pagar" derivado
(`FinanceService.payables()`, `status <> 'CANCELED'` e `total > paid_amount`);
`PaymentsService.payForPurchase()` grava `Payment` `OUT` e atualiza `paid_amount`;
despesas entram direto como saída no Caixa/DRE.

**Cruzamentos & acoplamento:**
- **`FinanceModule` importa `EventsModule`/`PurchasesModule`** (para ler saldos). Para
  evitar ciclo, o **recebimento "à vista" na criação da venda é uma 2ª chamada do
  frontend** a `POST /finance/events/:id/payments` — **não** acople o EventsModule ao
  FinanceModule para fazer isso no backend.
- Qualquer **nova** fonte de "a receber/a pagar" precisa respeitar o filtro
  `status <> 'CANCELED'`, senão itens cancelados reaparecem nas contas.

**Gotchas:**
- Colunas de dinheiro usam `decimalTransformer`
  (`apps/api/src/common/database/decimal.transformer.ts`): `to(undefined)` retorna
  **`undefined`** (deixa o default do DB agir) e `to(null)` grava `NULL`. Se você
  retornar `null` onde a coluna é `NOT NULL` com default, quebra o insert.
- Sempre arredonde com `roundMoney` (`apps/api/src/common/money/money.ts`); somar
  floats sem arredondar acumula erro de centavo.
- Datas de "dia de negócio" usam `todayISO()` (`apps/api/src/common/date/today.ts`,
  **local**, não UTC). Misturar com `toISOString().slice(0,10)` (UTC) desloca lançamentos
  de dia perto da meia-noite.
- Na venda rápida o preço de venda pode ser **sobreposto por item**
  (`quickSaleItem.unitSalePrice`); `soldValue`/`estimatedProfit` usam o override, o custo
  segue `defaultPurchasePrice` do catálogo.

**Testes que travam:** `finance.e2e-spec.ts` (inclui desfazer recebimento),
`cashflow.e2e-spec.ts`, `expenses-dre.e2e-spec.ts`.

---

## Fluxo 3 — Estoque (movimentos são a fonte de verdade)

**Invariante:** o saldo de um produto é a **soma dos seus movimentos**; não existe
campo "saldo" persistido que possa divergir. Toda origem de movimento é rastreável.

**Sequência:**
- **Entrada só quando ENTREGUE:** o estoque entra **apenas quando a compra está
  `RECEIVED`**. `PurchasesService.create()` registra na criação se já vier `RECEIVED`;
  uma compra criada como `ORDERED` (pedido, ainda não entregue) **não** mexe no estoque.
- **Marcar como recebida:** `PurchasesService.receive(id)`
  (`POST /purchases/:id/receive`) muda `ORDERED → RECEIVED` e chama
  `StockService.registerFromPurchase()`. `PurchasesService.update()` também
  **sincroniza** o estoque na transição de status: reverte se saía de `RECEIVED`,
  registra se passa a `RECEIVED` (idempotente — reverte antes de re-registrar).
- **Saída** ao vender: `EventsService.quickSale()` e `convertFromQuote()` chamam
  `StockService.registerFromEvent()`, gravando movimentos com **`sourceId = event.id`**.
- **Perda/ajuste avulso:** `StockService.registerManual()`.
- Saldo/alertas: `StockService.overview()` (lista **todos** os produtos, mesmo com saldo 0).

**Cruzamentos & acoplamento:** `EventsModule` e `PurchasesModule` importam
`StockModule`. O `sourceId` é o elo que permite o **estorno** (Fluxo 4): eventos via
`reverseEvent`, compras via `reversePurchase`. Compra fora de `RECEIVED` **não** mexe no
estoque.

**Gotchas:**
- Quantidades usam `quantityTransformer` (3 casas), **não** `decimalTransformer`.
- Se criar uma nova saída/entrada de estoque ligada a uma venda/compra, grave `sourceId`
  — senão o cancelamento/estorno não consegue reverter.
- Ao mudar o status de uma compra, **sincronize o estoque** (não deixe só o `create`
  fazer isso — `update`/`receive` também precisam).

**Testes que travam:** `stock.e2e-spec.ts` (inclui pedido → receber → estorno).

---

## Fluxo 4 — Cancelamento (o clássico "não cruza")

**Invariante:** cancelar **nunca** pode deixar estoque ou financeiro inconsistentes.
Ao cancelar, o estoque é devolvido e a conta em aberto some das contas a receber/pagar.

**Sequência (evento):** `EventsService.cancel()`
(`apps/api/src/modules/events/application/events.service.ts`):
1. Recusa se já `CANCELED`.
2. `StockService.reverseEvent(id)` — lê os movimentos por `sourceId` e grava movimentos
   inversos ("Estorno de cancelamento"), devolvendo saldo.
3. `updateById(id, { status: 'CANCELED' })`.
4. **O "a receber" some automaticamente**: `receivables()` filtra `status <> 'CANCELED'`.
   Não há reversão de `payments` — recebimentos já feitos permanecem no histórico.

**Compra:** ao sair de `RECEIVED` (para `ORDERED`/`CANCELED`, via `update`),
`StockService.reversePurchase(id)` devolve o saldo; e a compra deixa de contar em
`payables()` pelo filtro `status <> 'CANCELED'` (`purchases.service.ts`).

**Cruzamentos & acoplamento:** cancelamento toca **estoque** (explicitamente) **e**
**financeiro** (implicitamente, via filtro de status). Ao adicionar um novo efeito
colateral a uma venda/compra, pergunte: "o cancelamento desfaz isso?"

**Gotchas:**
- O literal do enum é **`CANCELED`** (um L, inglês) — não `CANCELLED`/`CANCELADO`.
- O estorno depende do `sourceId` nos movimentos (Fluxo 3).

**Testes que travam:** `events.e2e-spec.ts` (cancelamento + estorno); saldos conferidos
com `stock.e2e-spec.ts`/`finance.e2e-spec.ts`.

---

## Fluxo 5 — Orçamento → Venda (cálculo puro compartilhado)

**Invariante:** custo/venda/lucro/margem são calculados **por uma única função pura**,
usada igual no backend e no frontend — os números nunca divergem entre a tela e o banco.

**Sequência:**
1. Cálculo: `packages/types/src/quote-calculator.ts` (`calculateItem`, `calculateQuote`,
   `roundMoney`, `marginPercent`) — importado tanto pela API quanto pelo web
   (`quote-builder.tsx`).
2. Conversão em venda: `EventsService.convertFromQuote()` cria o `Event` e chama
   `StockService.registerFromEvent()` (Fluxo 3).
3. Duplicar: `QuotesService.duplicate()`.

**Cruzamentos & acoplamento:** o pacote `@sistema-flores/types` é a fronteira; mudou a
regra de cálculo? Mude **só** em `quote-calculator.ts` (rebuild do pacote) e os dois
lados acompanham.

**Gotchas:**
- **Update de itens = delete + insert** (`QuotesService.update()`:
  `this.items.delete({ quoteId })` e re-insere), para não nulificar o `quote_id`
  não-nulável dos itens órfãos.
- Só orçamentos editáveis podem ser alterados (`ensureEditable`).

**Testes que travam:** `quotes.e2e-spec.ts` (fluxo) e
`packages/types/src/quote-calculator.test.ts` (cálculo puro).

---

## Como verificar as specs contra o código

Com o Postgres de teste no ar (`pnpm db:up`), a suíte que trava esses fluxos:

```bash
pnpm --filter @sistema-flores/api test:e2e
```

Se um fluxo acima mudar de comportamento, o teste correspondente deve mudar junto —
esta é a garantia de que o mapa não vira ficção.
