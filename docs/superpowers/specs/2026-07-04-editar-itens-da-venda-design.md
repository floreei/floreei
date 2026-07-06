# Editar itens da venda no detalhe (com total configurável)

## Contexto
Hoje só a **venda rápida** (`POST /events/quick`) cria uma venda com itens; depois não
há como adicionar/editar os `event_items`. Isso deixa dois problemas: (1) vendas avulsas
(valor livre) não podem ganhar detalhamento; (2) 8 vendas de 03/07 ficaram com estoque +
total corretos mas **sem itens** (bug de uma build em desenvolvimento, já corrigido).

## Princípio
- **Itens sempre governam estoque + custo (COGS).** Cada item (produto ou buquê) dá baixa
  no estoque e define o custo.
- **A receita (Total) é configurável**, via seletor **Somar itens / Valor fixo**:
  - **Somar itens** → `soldValue` = soma das linhas (campo travado).
  - **Valor fixo** → `soldValue` digitado; itens não alteram o total.
- **Lucro** = `soldValue − custo` (recalculado).
- Ao reabrir, o modo é **inferido**: `soldValue == soma(itens)` → "Somar itens"; senão
  "Valor fixo". Sem coluna nova.

## Back-end (`apps/api`)
- **Refactor**: extrair de `quickSale` o método privado `processSaleItems(items)` →
  `{ itemEntities, consumption, saleSum, costSum }` (explode buquê em insumos, usa
  `currentUnitCost` do produto / `cost` do buquê). `quickSale` e a edição reusam.
- **Novo** `EventsService.editItems(id, input)`:
  1. carrega o evento (não pode estar `CANCELED`);
  2. `stock.reverseEvent(id)` — estorna o estoque atual;
  3. remove os `event_items` antigos e grava os novos (`processSaleItems`);
  4. `stock.registerFromEvent(id, date, consumption)` — novo consumo;
  5. `cost = costSum`; `soldValue` = `saleSum` (ITEMS) ou `input.soldValue` (FIXED);
     `estimatedProfit = soldValue − cost`.
- **Types** (`packages/types/src/event.ts`): `editSaleItemsSchema = { items:
  quickSaleItem[], pricingMode: "ITEMS" | "FIXED", soldValue?: number }` (refine: FIXED
  exige `soldValue >= 0`; ITEMS ignora `soldValue`). Reusa `quickSaleItemSchema`.
- **Rota**: `PATCH /events/:id/items` (guard ADMIN), DTO via `createZodDto`.
- `receivedValue` é preservado; se `soldValue < receivedValue`, o app mostra "recebido a
  mais" (não bloqueia).

## Front-end (`apps/web`)
- Card **"Itens vendidos"** ganha **"Editar itens"** (e **"Adicionar itens"** quando vazio).
- Novo diálogo `edit-sale-items-dialog.tsx`: reaproveita a UX de carrinho da venda rápida
  (buscar produto/buquê → carrinho com quantidade + preço unitário) + seletor
  **Somar itens / Valor fixo** no topo; campo de total aparece só no "Valor fixo".
- Hook `useEditSaleItems(id)` → `PATCH /events/:id/items`; invalida o detalhe + listas +
  estoque + caixa.
- Só ADMIN vê os botões (espelha o guard).

## Corrige as 8 vendas antigas
Sem migração: abrir a venda → "Valor fixo" (mantém o R$) → adicionar os itens → salvar.
Estoque estorna e re-registra (idêntico se os itens forem os mesmos) e o detalhamento aparece.

## Testes
- e2e (`events` ou novo `event-items`): editar em ITEMS (total=soma, custo dos itens,
  estoque ajustado); FIXED (total mantido, itens gravados, custo dos itens); adicionar
  itens numa venda com 0 itens; reduzir quantidade estorna estoque; venda cancelada → 400.
- Vitest: cálculo de total/lucro do editor (modo ITEMS vs FIXED).

## Fora de escopo
- Histórico/auditoria de edições. Reabrir venda cancelada para editar.
