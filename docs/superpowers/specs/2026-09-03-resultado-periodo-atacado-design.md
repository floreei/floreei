# Resultado do período no atacado — custo por item, semana e líquido

**Data:** 2026-09-03
**Escopo:** apps/api, apps/web, packages/types. Só o canal **WHOLESALE** (atacado).

## Objetivo

Na tela Atacado (`/atacado`), o dono precisa:

1. Ver facilmente os pedidos da semana.
2. Ver o lucro de cada pedido e do período filtrado (compra a 15, vende a 25 → lucro 10), linha a linha.
3. Ver o resultado **líquido** do período: lucro das vendas menos despesas lançadas (trabalhador, imposto, etc.), com clareza de "a quem e o quê" está pagando.

Tudo isso fica num modal separado para não poluir a listagem.

## Decisões tomadas com o usuário

- Custo por item é gravado na venda (snapshot), pré-preenchido com o custo do produto e editável na hora da venda.
- O líquido usa **somente despesas já lançadas** na tela Despesas. Sem cadastro de funcionário, imposto ou custo recorrente novo.
- Despesas entram no período pela **data de vencimento** (`dueDate`), pagas ou não; o modal marca o que está em aberto.
- Semana = segunda a domingo. Preset "Esta semana" + setas para semana anterior/próxima.
- Campo "Custo" no carrinho aparece **só** no diálogo de venda no atacado. Venda direta (varejo) não muda.
- **Sociedade (adendo de 2026-09-04):** alguns produtos (ex.: gipsófila, plantio feito em sociedade) têm o **lucro dividido entre N pessoas**. Só o lucro é dividido: o custo da flor fica cheio no produto e na venda. Na compra desses insumos, o que sai do caixa do usuário é a nota ÷ N. O N fica no produto (padrão 1) e é ajustável em cada linha da venda e em cada compra.

## 1. Custo por item

### Dados

- Nova coluna `event_items.unit_cost` — `decimal(12,2)`, **nullable**, sem default. Nula em itens de vendas anteriores à migração.
- `unit_cost` é o custo **por unidade de venda da linha** (a mesma unidade de `quantity`/`unit`): se a linha está em maço, é custo do maço; se em haste, custo da haste.
- Migração: `apps/api/src/database/migrations/<timestamp>-EventItemUnitCost.ts` (add column / drop column).

### Tipos (`packages/types/src/event.ts`)

- `quickSaleItemSchema` ganha `unitCost: z.coerce.number().nonnegative().optional()`.
- `EventItem` ganha:
  - `unitCost: number | null`
  - `lineCost: number | null` — `roundMoney(quantity × unitCost)`; null se `unitCost` null.
  - `lineProfit: number | null` — `roundMoney(lineTotal − lineCost)`; null se `lineCost` null.

### API (`events.service.ts` → `processSaleItems`)

- Produto: `unitCostDefault = pack ? roundMoney(currentUnitCost × packSize) : currentUnitCost`. Se `currentUnitCost` for 0, usa `defaultPurchasePrice` na mesma regra (maço ÷ haste conforme `packSize`).
- Buquê: `unitCostDefault = arrangement.cost`.
- `unitCost = item.unitCost ?? unitCostDefault`.
- `costAcc += quantity × unitCost` (substitui o cálculo por `baseQty × currentUnitCost`). `event.cost` e `estimatedProfit` continuam sendo a soma das linhas, como hoje.
- A entidade grava `unitCost` sempre (nunca null em vendas novas).
- `editItems` usa o mesmo caminho; o diálogo de editar itens reenvia `unitCost` de cada item existente para não perder o valor ajustado (sem campo novo na UI de edição).
- Mapper (`event.mapper.ts`) expõe `unitCost`, `lineCost`, `lineProfit`.

### Web — `wholesale-sale-dialog.tsx`

- `Sellable` ganha `cost` (custo por unidade de compra, já resolvido com a regra acima) e `CartItem` ganha `cost: number`.
- Ao adicionar ao carrinho, `cost = suggestedUnitCost(sellable, saleUnit)` (mesma lógica de maço↔haste de `suggestedUnitPrice`). Ao trocar a unidade da linha, preço **e** custo são recalculados.
- Cada linha do carrinho ganha, abaixo de "Preço", um `CurrencyInput` "Custo" (mesma altura/rótulo) e, à direita, "Lucro: R$ X" = `round(quantity × (price − cost))`, em `tabular-nums`, vermelho quando negativo.
- No rodapé do carrinho, além do total, uma linha discreta "Lucro estimado: R$ X".
- Submit envia `unitCost` por item.

## 1b. Sociedade — lucro dividido entre N pessoas

### Regra de dinheiro

Com N sócios, custo `C` cheio e venda `R`:

- `lineProfit = R − C` (lucro da linha, cheio).
- `myLineProfit = roundMoney(lineProfit / N)`; `partnersLineShare = roundMoney(lineProfit − myLineProfit)`.
- Compra em sociedade: `total` gravado = `roundMoney((itemsTotal + freight) / N)` (o que o usuário paga); `grossTotal = itemsTotal + freight` (nota cheia). O custo do produto (`currentUnitCost`, via estoque) usa o `unitPrice` cheio.

Exemplo (gipso, N = 3): compra 300 → paga 100; venda 1.500, custo 300, lucro 1.200, sua parte 400, sócios 800. Caixa do usuário: +1.500 − 100 − (800 + 200 reembolso do custo dos sócios) = 400. O acerto com os sócios **não** vira conta a pagar (fora de escopo); o modal mostra a parte deles como linha informativa.

### Dados

- `products.profit_shares` — `int NOT NULL DEFAULT 1`, `≥ 1`. Rótulo: "Lucro dividido entre (pessoas)".
- `event_items.profit_shares` — `int NOT NULL DEFAULT 1`. Snapshot na venda; pré-preenchido do produto, editável na linha do atacado. Buquê = 1.
- `events.partners_share` — `decimal(12,2) NOT NULL DEFAULT 0` = Σ `partnersLineShare`. `myProfit = estimatedProfit − partnersShare` (derivado no mapper).
- `purchases.profit_shares` — `int NOT NULL DEFAULT 1`; `purchases.gross_total` — `decimal(12,2)` (nota cheia). `total` passa a ser a parte do usuário. Backfill: `gross_total = total`.

### Tipos

- `productInputSchema.profitShares: z.coerce.number().int().min(1).default(1)`; `Product.profitShares: number`.
- `quickSaleItemSchema.profitShares: z.coerce.number().int().min(1).optional()`; `EventItem.profitShares: number`, `EventItem.myLineProfit: number | null`, `EventItem.partnersLineShare: number | null` (null quando `lineProfit` é null).
- `Event.partnersShare: number`, `Event.myProfit: number`.
- `purchaseInputSchema.profitShares: z.coerce.number().int().min(1).default(1)`; `Purchase.profitShares: number`, `Purchase.grossTotal: number`.
- `PeriodResultItem.profitShares`, `.myLineProfit`, `.partnersLineShare`; `PeriodResultOrder.partnersShare`, `.myProfit`; `PeriodResult.sales.partnersShare`, `.myProfit`; `net.value = roundMoney(sales.myProfit − expenses.total)`.

### UI

- Cadastro do produto: campo numérico "Lucro dividido entre" com sufixo "pessoas", padrão 1, dica "Ex.: plantio em sociedade com 2 pessoas = 3".
- Carrinho do atacado: por linha, seletor "Dividir lucro por" (stepper − 1 +, mínimo 1) pré-preenchido do produto. Quando N > 1 a linha mostra "Sua parte: R$ X" além do lucro. Rodapé: "Lucro estimado" e, se houver alguma linha com N > 1, "Sua parte: R$ X".
- Compra: campo "Compra em sociedade: dividir por" (stepper, padrão 1). Quando N > 1, o rodapé mostra "Nota: R$ cheio · Sua parte (÷N): R$ X" e o total gravado é a parte. Lista de compras exibe `total` (sua parte) como hoje.
- Modal Resultado do período: tile "Lucro bruto" ganha, abaixo, "sua parte R$ X" quando `partnersShare > 0`; linha do pedido mostra Venda, Custo, Lucro, **Sua parte**; itens mostram N e sua parte; bloco Líquido: Lucro bruto − Parte dos sócios = Lucro seu; − Despesas = Resultado líquido.

## 2. Semana no filtro (`sales-filters.tsx`)

- Preset novo **"Esta semana"** (segunda a domingo da semana corrente, em data local), inserido entre "Hoje" e "7 dias".
- Quando `from`/`to` formam exatamente uma semana seg→dom (7 dias, `from` é segunda), aparecem dois botões de ícone `ChevronLeft`/`ChevronRight` (alvo ≥44px, `aria-label` "Semana anterior"/"Próxima semana") ao lado dos presets, deslocando ambos os limites em ±7 dias. O chip ativo mostra o intervalo curto (ex.: "31/08 – 06/09") quando não é a semana corrente.
- Componente é compartilhado (vendas, compras, loja): a mudança vale para todos, sem regressão de comportamento.

## 3. Modal "Resultado do período"

### Gatilho e filtros

- Botão outline "Resultado do período" (ícone `Wallet`) ao lado de "Insights do período" em `/atacado`. Abre `PeriodResultDialog` (`apps/web/src/components/wholesale/period-result-dialog.tsx`).
- Recebe os mesmos filtros da listagem: `from`, `to`, `paymentStatus`, `delivered`, `search`, `channel: "WHOLESALE"`.
- Sem período (Todo período), a API usa o mês corrente; o cabeçalho do modal mostra o intervalo efetivo e a nota "Sem período escolhido: mostrando o mês atual".
- Hook `usePeriodResult(query)` em `apps/web/src/lib/api/events.ts`, `staleTime: 60_000`, `enabled: open`.

### Layout (mobile-first, tela cheia no celular, `max-w-2xl` no desktop)

1. **Vendas** — 4 tiles: Pedidos (n), Receita, Custo das flores, Lucro bruto (com margem % pequena embaixo).
2. **Por pedido** — lista; cada linha: data, cliente (ou título), venda, custo, lucro. Toque expande os itens: descrição, `qtd × unidade`, custo unit., preço unit., lucro da linha. Item com `unitCost` null mostra "—" no custo e no lucro da linha; o pedido continua com o lucro do cabeçalho.
3. **Despesas do período** — agrupadas por centro de custo (ordem: maior total primeiro). Cada grupo: nome + subtotal; dentro, uma linha por despesa: descrição, vencimento, valor, selo "Paga" / "Em aberto" (vencida = "Vencida", destrutivo). Rodapé: Total, e "sendo R$ X ainda em aberto" quando houver.
4. **Líquido** — bloco destacado: Lucro bruto − Despesas = **Resultado líquido**, com margem líquida (líquido ÷ receita). Nota fixa: "Despesas são de toda a empresa, não só do atacado."
- Estados: skeleton enquanto carrega; vazio ("Nenhuma venda no período") mantendo o bloco de despesas e o líquido (que vira −despesas).
- Sem emoji; ícones lucide; moeda em `tabular-nums`; sem serif fora de título de página; pt-BR.

## 4. Backend — `GET /events/period-result`

- Controller: `events.controller.ts`, `@RequiresFeature("SALES")`, query validada por `periodResultQuerySchema = insightsQuerySchema` (mesmo shape).
- Service novo: `apps/api/src/modules/events/application/period-result.service.ts`, seguindo o padrão de `sales-insights.service.ts` (tenant via `TenantContextService`, `defaultRange` = mês corrente).
- Vendas: mesmo filtro da listagem (`EventRepository.search`-like: canal, período por `event.date`, `paymentStatus`, `delivered`, `search`), **excluindo `CANCELED`**, sem paginação, ordenado por data desc. Carrega `customer` e `items`.
- Despesas: `ExpenseEntity` da empresa com `dueDate` entre `from` e `to` (o módulo de eventos importa o repositório/entity de expenses via TypeORM; sem chamar o controller de expenses — o gate `FINANCE` protege a tela, o dado agregado aqui é da mesma empresa).
- Resposta (`packages/types/src/period-result.ts`):

```ts
interface PeriodResult {
  from: string; to: string; defaultedPeriod: boolean;
  sales: { count: number; revenue: number; cost: number; grossProfit: number; grossMargin: number | null };
  orders: Array<{
    id: string; date: string; title: string; customerName: string | null;
    soldValue: number; cost: number; profit: number;
    items: Array<{ description: string; quantity: number; unit: ProductUnit;
      unitSalePrice: number; unitCost: number | null;
      lineTotal: number; lineCost: number | null; lineProfit: number | null }>;
  }>;
  expenses: {
    total: number; paidTotal: number; unpaidTotal: number;
    groups: Array<{ costCenter: string; total: number;
      entries: Array<{ id: string; description: string; amount: number;
        dueDate: string; paid: boolean; overdue: boolean }> }>;
  };
  net: { value: number; margin: number | null };
}
```

- Invariantes: `grossProfit = roundMoney(revenue − cost)`; `net.value = roundMoney(grossProfit − expenses.total)`; margens = null quando `revenue = 0`; todo dinheiro passa por `roundMoney`. `overdue = !paid && dueDate < hoje`.

## Testes

- **API e2e** (`apps/api/test/period-result.e2e-spec.ts` + caso novo em `events.e2e-spec.ts`):
  - venda rápida com `unitCost` grava o valor e `event.cost` = soma das linhas; sem `unitCost` usa custo do produto (maço × packSize quando em maço).
  - `editItems` preserva `unitCost` reenviado.
  - `period-result`: agrega receita/custo/lucro só do canal WHOLESALE, ignora CANCELED, inclui despesa por `dueDate` dentro do período (paga e em aberto), exclui fora, calcula `net` e `overdue`; outra empresa não vaza.
- **Web Playwright** (`apps/web/e2e/atacado-resultado.spec.ts`): preset "Esta semana" seleciona seg→dom e as setas deslocam 7 dias; criar venda no atacado com custo editado e ver, no modal, lucro do pedido e líquido = lucro − despesa lançada.
- **Unit** (`packages/types`): helpers de semana (`startOfWeek`, `shiftWeek`) se extraídos para `apps/web/src/lib/week.ts` → teste em Playwright ou vitest do web, conforme já existir.

## Fora de escopo

- Custo por item na venda direta (varejo) e no diálogo de editar itens (só preserva).
- Cadastro de funcionários, impostos ou custos recorrentes automáticos.
- Filtrar despesas por canal.
- Acerto financeiro com os sócios (conta a pagar da parte deles).
- Exportar/imprimir o resultado.
