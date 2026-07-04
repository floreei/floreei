# Fase 2 — Custeio de produtos compostos, estoque perpétuo e resultado real (floricultura)

- **Data:** 2026-07-04
- **Status:** Aprovado (visão da fase). Cada milestone terá sua própria spec/plano.

## Contexto

Hoje o sistema atende **revenda 1:1**: cada linha de venda é `produto × (preço de compra, preço de
venda)` e a DRE calcula lucro = **receita − todas as compras do período** (`reports.service.ts:78-89`).
Isso mistura *saída de caixa em compras* com *custo do que foi vendido* — não serve para floricultura.

**Objetivo:** atender também donos de floricultura, que compram insumos em **pacote** (ex.: maço de
5 hastes a R$15) e vendem **produtos compostos** (buquês/arranjos) que consomem **frações** de vários
insumos. Precisamos do **custo e lucro real por buquê** e do **resultado real da empresa** (tudo que
entra e sai + o lucro), sem quebrar o fluxo de revenda que já existe.

**Critérios de sucesso:** dado o exemplo abaixo, o sistema mostra o custo do buquê, o lucro por venda,
o saldo de estoque em unidade-base e uma DRE cujo lucro bruto = receita − COGS (não − compras).

**Decisões travadas com o usuário:**
1. **Ficha técnica + estoque perpétuo** — o buquê tem receita e a venda dá baixa fracionada no estoque.
2. **Custo por última compra** — custo unitário do insumo = preço da última compra ÷ conteúdo do pacote.
3. **Custo do buquê = só materiais diretos** — flores + materiais. Mão de obra/aluguel/energia ficam
   na DRE da empresa (lucro líquido), sem rateio por buquê.
4. **Vender pelo fluxo atual** — pedido de balcão (`EventType.ORDER`) ou evento (`EVENT`); nada de PDV novo.

## Exemplo que a modelagem precisa fechar
- Compra: 1 maço de hortênsia = 5 hastes por **R$15** → `currentUnitCost` hortênsia = **R$3/haste**; estoque **+5 hastes**.
- Buquê: receita = 1 haste hortênsia (R$3) + 3 rosas (R$2,50 = R$7,50) + fita 1 un (R$1,20) → **custo R$11,70**.
- Venda do buquê por **R$100** → **lucro (margem de contribuição) = R$88,30**; estoque baixa −1 haste, −3 rosas, −1 fita.
- DRE do mês: receita R$100, **COGS R$11,70**, lucro bruto R$88,30, − despesas (aluguel etc.) = **lucro líquido**.

## Modelo (visão de especialista)

### Insumo (estende `ProductEntity`, `modules/catalog`)
Item comprado e consumido (flor, folhagem, **material**: fita, papel, oásis). Campos novos:
- `baseUnit` (unidade de **consumo**, ex.: HASTE/UNIDADE/METRO/GRAMA) — o estoque vive nela.
- `purchaseUnit` (unidade de **compra**, ex.: MACO/CAIXA) + `packSize` (conteúdo por pacote, ex.: 5).
- `currentUnitCost` (custo atual por unidade-base = última compra ÷ packSize; **override manual** permitido).
- Estoque já é por produto (`stock_movements`) — passa a ser em **unidade-base**.

### Produto composto / buquê (NOVO módulo `arrangements`)
- `ArrangementEntity`: nome, categoria, `salePrice` (venda sugerida), `active`.
- `ArrangementItemEntity` (a receita/ficha técnica): `productId` (insumo) + `quantity` (na unidade-base).
- Derivados (mesma ideia do `quote-calculator`, cálculo ao vivo no front): `cost = Σ(item.quantity ×
  product.currentUnitCost)`, `margin = salePrice − cost`, `marginPercent`.

### Compra → estoque + custo (`modules/purchases` + `modules/stock`)
- Item de compra passa a **referenciar o insumo** (`productId`) e registrar o pacote comprado
  (quantidade de pacotes, unidade de compra, preço por pacote).
- No **recebimento** (`purchases.service.receive`): `stock.registerFromPurchase` grava ENTRADA =
  `quantidade × packSize` (unidade-base) e atualiza `currentUnitCost = unitPrice ÷ packSize` (última compra).
- Frete fica fora do custo unitário no v1 (vira custo operacional na DRE) — refinamento futuro.

### Venda → baixa fracionada + COGS (`modules/events` + `modules/stock`)
- A linha de venda pode ser **insumo avulso** (revenda de uma flor) **ou um buquê** (`arrangementId`).
- Ao confirmar a venda: para cada linha-buquê, **explode a receita** → SAIDA fracionada no estoque e
  soma o **COGS** = `qtd × arrangement.cost`; linha-insumo: SAIDA `qtd` + COGS `qtd × currentUnitCost`.
- O COGS da venda é **persistido** no evento (novo campo) para a DRE não depender de recalcular custo histórico.

### Resultado (DRE por competência) × Caixa
- Reescreve `reports.service.summary`: **lucro bruto = receita − COGS** (não mais − compras).
  − despesas operacionais (`expenses`, já existe) − **perdas** (PERDA valorizada a custo) = **lucro líquido**.
- Deixa explícito no app a diferença entre **Caixa** (entradas/saídas reais — já existe) e **Resultado**
  (competência): comprar estoque é saída de caixa, mas só vira custo quando **vende**.
- Estoque valorizado (`Σ saldo × currentUnitCost`) e alerta de reposição (`minStock`, já existe) na visão.

### Coexistência revenda × floricultura (invariante)
As duas modas convivem: **linha de revenda** mantém custo **manual** (compra sob encomenda, como hoje);
**linha de floricultura** (buquê/insumo de estoque) **deriva** o custo do estoque. Ambas somam no **mesmo
COGS** da DRE. Não pode quebrar orçamentos/eventos existentes.

## Decomposição em specs/milestones
Fase 2 é grande demais para um plano só. Cada milestone vira **sua própria spec + plano + testes**:

- **M1 — Insumos com unidade-base, pacote e custo (última compra).** Fundação. Estende `ProductEntity`,
  liga item de compra ao insumo, recebimento atualiza `currentUnitCost` + estoque em unidade-base.
- **M2 — Buquês com ficha técnica e custo derivado.** Módulo `arrangements` + builder com custo/margem ao vivo.
- **M3 — Venda do buquê consome estoque + COGS.** Linha de venda referencia buquê; confirma → explode
  receita → SAIDA fracionada + COGS persistido. Reaproveita `stock.registerFromEvent`.
- **M4 — DRE por COGS + perdas + estoque valorizado + alertas.** Reescreve `reports.summary`, separa
  Caixa × Resultado, valoriza estoque.

## Milestone 1 (detalhado para começar)
**Arquivos:** `packages/types/src/enums.ts` (unidades-base: HASTE já existe; add METRO, GRAMA),
`packages/types/src/product.ts` (schema: baseUnit, purchaseUnit, packSize, currentUnitCost),
`catalog/infrastructure/product.entity.ts` (+colunas) e migration,
`purchases/infrastructure/purchase-item.entity.ts` (+`productId` opcional → insumo),
`purchases/application/purchases.service.ts` (`receive`/`update` atualizam `currentUnitCost`),
`stock/application/stock.service.ts` (`registerFromPurchase` grava base units = `qtd × packSize`),
front: cadastro de insumo (pacote/conteúdo/unidade-base) e a compra referenciando insumo.
**Compat:** produtos existentes → migração define `baseUnit = unit`, `packSize = 1`,
`currentUnitCost = defaultPurchasePrice` (revenda 1:1 segue idêntica).

## Verificação
- e2e por milestone (padrão `*.e2e-spec.ts`, emulador Firebase já configurado).
- M1: comprar 1 maço (5 hastes, R$15) → `currentUnitCost = 3` e estoque = 5 hastes.
- Fim da fase: reproduzir o exemplo (buquê custo R$11,70, venda R$100 → lucro R$88,30; DRE lucro bruto = receita − COGS).
- `pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @sistema-flores/api test:e2e`.
- Atualizar `SPECS.md` com os fluxos novos (estoque fracionado, COGS na venda) e os invariantes.

## Riscos
- **Não quebrar a revenda** (custo manual coexiste com custo derivado) — coberto pela migração de compat.
- Migrar unidades/estoque dos produtos existentes com segurança (base = unit, packSize = 1).
- Escopo: implementar **milestone a milestone**, cada um com spec/plano próprios após aprovar esta visão.
