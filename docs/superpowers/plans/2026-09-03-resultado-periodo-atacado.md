# Resultado do período no atacado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na tela Atacado, gravar o custo por item na venda, navegar por semana e abrir um modal "Resultado do período" com lucro por pedido, despesas do período e resultado líquido.

**Architecture:** Nova coluna `unit_cost` em `event_items` (snapshot do custo na venda, editável no diálogo do atacado). Novo endpoint `GET /events/period-result` (NestJS, mesmo filtro dos insights) que agrega vendas WHOLESALE com itens e despesas por vencimento. No web, preset "Esta semana" + setas no filtro compartilhado, e um `PeriodResultDialog` alimentado por `usePeriodResult`.

**Tech Stack:** NestJS + TypeORM (Postgres), Zod via `@sistema-flores/types` (nestjs-zod), Next.js + TanStack Query + Radix Dialog + Tailwind, Jest e2e (API), Vitest (types/web), Playwright (web).

**Spec:** `docs/superpowers/specs/2026-09-03-resultado-periodo-atacado-design.md`

## Global Constraints

- Só o canal **WHOLESALE**; venda direta (varejo) não muda.
- Todo dinheiro passa por `roundMoney` (API: `apps/api/src/common/money/money.ts`; types: `packages/types/src/quote-calculator.ts`). Margens são em 0–100 (`marginPercent` style); `formatPercent` do web recebe 0–100.
- `unit_cost` é custo **por unidade de venda da linha** (mesma unidade de `quantity`/`unit`).
- Despesas entram pela **`dueDate`** dentro de `[from, to]`, pagas ou não; `overdue = !paid && dueDate < hoje`.
- Semana = **segunda a domingo**, em data local.
- UI em pt-BR, sem emoji, ícones `lucide-react`, moeda em `tabular-nums`, alvos de toque ≥ 44px, serif só em título de página.
- Commits direto na `main` (regra do repo). **Não fazer push.**
- Rodar cada comando a partir da raiz do repo: `/Users/hugouraga/dev/pessoal/sistema-flores/floreei`.
- Testes e2e da API precisam do Postgres de teste e Firebase (config já existente): `pnpm --filter @sistema-flores/api test:e2e -- <arquivo>`.

---

## File map

| Arquivo | Responsabilidade |
|---|---|
| `packages/types/src/event.ts` | `unitCost` no item de venda rápida; `unitCost/lineCost/lineProfit` em `EventItem` |
| `packages/types/src/period-result.ts` (novo) | Tipos + schema de query do resultado do período |
| `packages/types/src/index.ts` | exporta `period-result` |
| `apps/api/src/database/migrations/1787000000000-EventItemUnitCost.ts` (novo) | coluna `unit_cost` |
| `apps/api/src/modules/events/infrastructure/event-item.entity.ts` | coluna `unitCost` |
| `apps/api/src/modules/events/application/events.service.ts` | custo por linha em `processSaleItems` |
| `apps/api/src/modules/events/application/event.mapper.ts` | expõe custo/lucro da linha |
| `apps/api/src/modules/events/application/period-result.service.ts` (novo) | agregação vendas + despesas + líquido |
| `apps/api/src/modules/events/presentation/events.controller.ts` | rota `GET /events/period-result` |
| `apps/api/src/modules/events/events.module.ts` | registra service + `ExpenseEntity` |
| `apps/api/test/events-unit-cost.e2e-spec.ts` (novo) | custo por item |
| `apps/api/test/period-result.e2e-spec.ts` (novo) | endpoint |
| `apps/web/src/lib/sale-units.ts` | `suggestedUnitCost` |
| `apps/web/src/lib/sale-units.test.ts` (novo) | teste |
| `apps/web/src/lib/week.ts` (novo) | `currentWeekRange`, `isWeekRange`, `shiftWeek`, `formatShortRange` |
| `apps/web/src/lib/week.test.ts` (novo) | teste |
| `apps/web/src/components/shared/sales-filters.tsx` | preset "Esta semana" + setas |
| `apps/web/src/components/wholesale/wholesale-sale-dialog.tsx` | campo "Custo" + lucro por linha e do carrinho |
| `apps/web/src/components/events/edit-sale-items-dialog.tsx` | preserva `unitCost` |
| `apps/web/src/lib/api/events.ts` | `usePeriodResult` |
| `apps/web/src/components/wholesale/period-result-dialog.tsx` (novo) | o modal |
| `apps/web/src/app/(dashboard)/atacado/page.tsx` | botão que abre o modal |
| `apps/web/e2e/atacado-resultado.spec.ts` (novo) | Playwright |

---

### Task 1: Tipos — `unitCost` no item e tipos do resultado do período

**Files:**
- Modify: `packages/types/src/event.ts` (schema `quickSaleItemSchema` ~linha 60; interface `EventItem` ~linha 170)
- Create: `packages/types/src/period-result.ts`
- Modify: `packages/types/src/index.ts`
- Test: `packages/types/src/event.test.ts` (novo)

**Interfaces:**
- Produces: `QuickSaleItem.unitCost?: number`; `EventItem.unitCost: number | null`, `EventItem.lineCost: number | null`, `EventItem.lineProfit: number | null`; `periodResultQuerySchema`, `PeriodResultQuery`, `PeriodResult`, `PeriodResultOrder`, `PeriodResultItem`, `PeriodResultExpenseGroup`, `PeriodResultExpense`.

- [ ] **Step 1: Escrever o teste do schema**

`packages/types/src/event.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { quickSaleItemSchema } from "./event";

describe("quickSaleItemSchema.unitCost", () => {
  it("aceita unitCost numérico (string coerida) e opcional", () => {
    const withCost = quickSaleItemSchema.parse({
      productId: "3f6c2c6e-6f9a-4b1a-9c3e-1f2a3b4c5d6e",
      quantity: 2,
      unitCost: "15.5",
    });
    expect(withCost.unitCost).toBe(15.5);

    const without = quickSaleItemSchema.parse({
      productId: "3f6c2c6e-6f9a-4b1a-9c3e-1f2a3b4c5d6e",
      quantity: 2,
    });
    expect(without.unitCost).toBeUndefined();
  });

  it("rejeita unitCost negativo", () => {
    expect(() =>
      quickSaleItemSchema.parse({
        productId: "3f6c2c6e-6f9a-4b1a-9c3e-1f2a3b4c5d6e",
        quantity: 1,
        unitCost: -1,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/types test -- event.test.ts`
Expected: FAIL — `unitCost` não existe no schema (parse de `-1` não lança / valor é removido).

- [ ] **Step 3: Adicionar `unitCost` ao schema e campos ao `EventItem`**

Em `packages/types/src/event.ts`, dentro de `quickSaleItemSchema`, após `unitSalePrice`:

```ts
    /**
     * Custo por unidade de venda desta linha (snapshot). Ausente ⇒ a API usa o
     * custo atual do produto (ou do buquê) na unidade escolhida.
     */
    unitCost: z.coerce.number().nonnegative().optional(),
```

Na interface `EventItem`, após `lineTotal`:

```ts
  /** Custo por unidade de venda (snapshot na venda). null em vendas antigas. */
  unitCost: number | null;
  /** quantity × unitCost. null quando unitCost é null. */
  lineCost: number | null;
  /** lineTotal − lineCost. null quando lineCost é null. */
  lineProfit: number | null;
```

- [ ] **Step 4: Criar `period-result.ts`**

`packages/types/src/period-result.ts`:

```ts
import { z } from "zod";
import { insightsQuerySchema } from "./event";
import type { ProductUnit } from "./enums";

/** Mesmo filtro dos insights — a tela passa período + filtros da listagem. */
export const periodResultQuerySchema = insightsQuerySchema;
export type PeriodResultQuery = z.infer<typeof periodResultQuerySchema>;

export interface PeriodResultItem {
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitSalePrice: number;
  /** null em itens de vendas anteriores ao custo por item. */
  unitCost: number | null;
  lineTotal: number;
  lineCost: number | null;
  lineProfit: number | null;
}

export interface PeriodResultOrder {
  id: string;
  date: string;
  title: string;
  customerName: string | null;
  soldValue: number;
  cost: number;
  profit: number;
  items: PeriodResultItem[];
}

export interface PeriodResultExpense {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  overdue: boolean;
}

export interface PeriodResultExpenseGroup {
  costCenter: string;
  total: number;
  entries: PeriodResultExpense[];
}

/**
 * Resultado do período (tela Atacado): vendas com lucro por pedido e por item,
 * despesas lançadas por vencimento no período e o líquido = lucro bruto − despesas.
 * Despesas são da empresa toda (não têm canal).
 */
export interface PeriodResult {
  from: string;
  to: string;
  /** true quando a query não trouxe período e a API usou o mês corrente. */
  defaultedPeriod: boolean;
  sales: {
    count: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    /** 0–100; null quando revenue = 0. */
    grossMargin: number | null;
  };
  orders: PeriodResultOrder[];
  expenses: {
    total: number;
    paidTotal: number;
    unpaidTotal: number;
    /** Ordenado por total desc. */
    groups: PeriodResultExpenseGroup[];
  };
  net: {
    value: number;
    /** 0–100; null quando revenue = 0. */
    margin: number | null;
  };
}
```

Em `packages/types/src/index.ts`, após `export * from "./insights";` adicionar:

```ts
export * from "./period-result";
```

- [ ] **Step 5: Rodar teste e typecheck**

Run: `pnpm --filter @sistema-flores/types test -- event.test.ts && pnpm --filter @sistema-flores/types typecheck && pnpm --filter @sistema-flores/types lint`
Expected: PASS / sem erros.

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/event.ts packages/types/src/event.test.ts packages/types/src/period-result.ts packages/types/src/index.ts
git commit -m "feat(types): custo por item na venda e tipos do resultado do período

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 2: API — coluna `unit_cost`, custo por linha e mapper

**Files:**
- Create: `apps/api/src/database/migrations/1787000000000-EventItemUnitCost.ts`
- Modify: `apps/api/src/modules/events/infrastructure/event-item.entity.ts` (após `lineTotal`)
- Modify: `apps/api/src/modules/events/application/events.service.ts` (`processSaleItems`, ~linhas 83–150)
- Modify: `apps/api/src/modules/events/application/event.mapper.ts` (`toItem`)
- Test: `apps/api/test/events-unit-cost.e2e-spec.ts`

**Interfaces:**
- Consumes: `QuickSaleItem.unitCost` (Task 1).
- Produces: `EventItemEntity.unitCost: number | null`; `GET /events/:id` devolve `items[].unitCost/lineCost/lineProfit`; `event.cost` = Σ `quantity × unitCost`.

- [ ] **Step 1: Escrever o e2e**

`apps/api/test/events-unit-cost.e2e-spec.ts`:

```ts
import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

describe("Vendas — custo por item (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    const reg = await registerCompany(http, { email: "unitcost" });
    token = reg.accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  /** Maço de 5 hastes: custo 3/haste (=15/maço), venda 25/maço. */
  async function makePackProduct() {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Rosas" }).expect(201)
    ).body;
    return (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          categoryId: cat.id,
          name: "Rosa Vermelha",
          unit: "HASTE",
          purchaseUnit: "MACO",
          packSize: 5,
          defaultPurchasePrice: 15,
          defaultSalePrice: 25,
          currentUnitCost: 3,
        })
        .expect(201)
    ).body.id;
  }

  it("grava unitCost informado e usa na soma do custo da venda", async () => {
    const pid = await makePackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 2, saleUnit: "MACO", unitSalePrice: 25, unitCost: 16 }],
      })
      .expect(201);

    expect(sale.body.soldValue).toBe(50);
    expect(sale.body.cost).toBe(32);
    expect(sale.body.estimatedProfit).toBe(18);
    expect(sale.body.items[0]).toMatchObject({
      unitCost: 16,
      lineCost: 32,
      lineProfit: 18,
    });
  });

  it("sem unitCost, usa o custo do produto na unidade da linha (maço = haste × packSize)", async () => {
    const pid = await makePackProduct();
    const byPack = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 2, saleUnit: "MACO", unitSalePrice: 25 }],
      })
      .expect(201);
    expect(byPack.body.items[0].unitCost).toBe(15);
    expect(byPack.body.cost).toBe(30);

    const byStem = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 4, saleUnit: "HASTE", unitSalePrice: 6 }],
      })
      .expect(201);
    expect(byStem.body.items[0].unitCost).toBe(3);
    expect(byStem.body.cost).toBe(12);
  });

  it("sem custo atual, cai no preço de compra padrão", async () => {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: "Folhagens" }).expect(201)
    ).body;
    const pid = (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          categoryId: cat.id,
          name: "Eucalipto",
          unit: "HASTE",
          purchaseUnit: "MACO",
          packSize: 10,
          defaultPurchasePrice: 20,
          defaultSalePrice: 40,
          currentUnitCost: 0,
        })
        .expect(201)
    ).body.id;

    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 1, saleUnit: "MACO", unitSalePrice: 40 }],
      })
      .expect(201);
    expect(sale.body.items[0].unitCost).toBe(20);
    expect(sale.body.cost).toBe(20);
  });

  it("editar itens preserva o unitCost reenviado", async () => {
    const pid = await makePackProduct();
    const sale = await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        items: [{ productId: pid, quantity: 1, saleUnit: "MACO", unitSalePrice: 25, unitCost: 17 }],
      })
      .expect(201);

    const edited = await http
      .patch(`/api/events/${sale.body.id}/items`)
      .set(auth())
      .send({
        pricingMode: "ITEMS",
        items: [{ productId: pid, quantity: 3, saleUnit: "MACO", unitSalePrice: 25, unitCost: 17 }],
      })
      .expect(200);
    expect(edited.body.items[0].unitCost).toBe(17);
    expect(edited.body.cost).toBe(51);
    expect(edited.body.estimatedProfit).toBe(24);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/api test:e2e -- events-unit-cost`
Expected: FAIL — `items[0].unitCost` é `undefined`.

- [ ] **Step 3: Migração**

`apps/api/src/database/migrations/1787000000000-EventItemUnitCost.ts`:

```ts
import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Custo por unidade de venda de cada item (snapshot na venda). Nulo em itens
 * anteriores — o custo deles continua só no cabeçalho (`events.cost`).
 */
export class EventItemUnitCost1787000000000 implements MigrationInterface {
  name = "EventItemUnitCost1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_items" ADD COLUMN "unit_cost" numeric(12,2) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event_items" DROP COLUMN "unit_cost"`);
  }
}
```

Verifique como as migrations são registradas (`grep -rn "1786900000000" apps/api/src --include=*.ts`). Se houver uma lista explícita (ex.: `apps/api/src/database/migrations/index.ts` ou `data-source.ts`), adicione a nova classe nela seguindo o padrão; se for glob, nada a fazer.

- [ ] **Step 4: Entidade**

Em `event-item.entity.ts`, após o bloco de `lineTotal`:

```ts
  /** Custo por unidade de venda (snapshot). null em vendas anteriores. */
  @Column({
    name: "unit_cost",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  unitCost!: number | null;
```

Confirme que `decimalTransformer` devolve `null` para `null` (`apps/api/src/common/database/decimal.transformer.ts`). Se converter `null` em `0`, use um transformer local:

```ts
const nullableDecimal = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null ? null : Number(v)),
};
```

- [ ] **Step 5: `processSaleItems` — custo por linha**

Em `events.service.ts`, substitua o bloco de produto e de buquê dentro de `processSaleItems`:

Buquê (trocar `costAcc += item.quantity * arr.cost;` e o `Object.assign`):

```ts
        const unitCost = item.unitCost ?? arr.cost;
        saleAcc += item.quantity * unitSale;
        costAcc += item.quantity * unitCost;
        for (const comp of arr.items) {
          consumption.push({
            productId: comp.productId,
            quantity: roundQty(item.quantity * comp.quantity),
          });
        }
        Object.assign(ei, {
          productId: null,
          arrangementId: arr.id,
          description: arr.name,
          quantity: item.quantity,
          unit: "UNIDADE",
          unitSalePrice: roundMoney(unitSale),
          lineTotal: roundMoney(item.quantity * unitSale),
          unitCost: roundMoney(unitCost),
        });
```

Produto (após o cálculo de `pack`/`baseQty`/`perUnitDefault`; trocar `costAcc += baseQty * product.currentUnitCost;` e o `Object.assign`):

```ts
        const unitSale = item.unitSalePrice ?? perUnitDefault;
        // Custo base por haste: custo atual; se zerado, preço de compra padrão
        // (que é por unidade de compra) ÷ packSize.
        const baseUnitCost =
          product.currentUnitCost > 0
            ? product.currentUnitCost
            : product.packSize > 1
              ? roundMoney(product.defaultPurchasePrice / product.packSize)
              : product.defaultPurchasePrice;
        const unitCostDefault = pack
          ? roundMoney(baseUnitCost * product.packSize)
          : baseUnitCost;
        const unitCost = item.unitCost ?? unitCostDefault;
        saleAcc += item.quantity * unitSale;
        costAcc += item.quantity * unitCost;
        consumption.push({ productId: product.id, quantity: baseQty });
        Object.assign(ei, {
          productId: product.id,
          arrangementId: null,
          description: product.name,
          quantity: item.quantity,
          unit: item.saleUnit ?? product.unit,
          unitSalePrice: roundMoney(unitSale),
          lineTotal: roundMoney(item.quantity * unitSale),
          unitCost: roundMoney(unitCost),
        });
```

Atualize o docstring do método: `Custo = quantity × unitCost (informado ou custo do produto/buquê na unidade da linha).`

- [ ] **Step 6: Mapper**

Em `event.mapper.ts`, `toItem`:

```ts
function toItem(item: EventItemEntity): EventItem {
  const unitCost = item.unitCost ?? null;
  const lineCost = unitCost === null ? null : roundMoney(item.quantity * unitCost);
  return {
    id: item.id,
    productId: item.productId,
    arrangementId: item.arrangementId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitSalePrice: item.unitSalePrice,
    lineTotal: item.lineTotal,
    unitCost,
    lineCost,
    lineProfit: lineCost === null ? null : roundMoney(item.lineTotal - lineCost),
  };
}
```

Importar `roundMoney` de `../../../common/money/money`.

- [ ] **Step 7: Rodar e2e novo + os que já existem de vendas**

Run: `pnpm --filter @sistema-flores/api test:e2e -- events-unit-cost events.e2e sales-insights`
Expected: PASS. Depois `pnpm --filter @sistema-flores/api typecheck && pnpm --filter @sistema-flores/api lint`.

Atenção: `events.e2e-spec.ts` pode ter asserts em `cost` de venda de produto de pacote calculados por `baseQty × currentUnitCost`. Com `unitCost` default = `baseUnitCost × packSize` arredondado, o resultado é o mesmo salvo arredondamento em pacotes com custo fracionário; se algum assert quebrar por centavos, ajuste o valor esperado no teste e explique no commit.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/database/migrations/1787000000000-EventItemUnitCost.ts apps/api/src/modules/events apps/api/test/events-unit-cost.e2e-spec.ts
git commit -m "feat(api): custo por item na venda (unit_cost) com snapshot editável

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 3: API — `GET /events/period-result`

**Files:**
- Create: `apps/api/src/modules/events/application/period-result.service.ts`
- Modify: `apps/api/src/modules/events/presentation/events.controller.ts` (antes de `@Get(":id")`)
- Modify: `apps/api/src/modules/events/events.module.ts`
- Test: `apps/api/test/period-result.e2e-spec.ts`

**Interfaces:**
- Consumes: `periodResultQuerySchema`, `PeriodResult` (Task 1); `EventItemEntity.unitCost` (Task 2); `ExpenseEntity` (`apps/api/src/modules/expenses/infrastructure/expense.entity.ts`).
- Produces: `PeriodResultService.generate(query: PeriodResultQuery): Promise<PeriodResult>`; rota `GET /api/events/period-result`.

- [ ] **Step 1: Escrever o e2e**

`apps/api/test/period-result.e2e-spec.ts`:

```ts
import request from "supertest";
import { bearer, registerCompany } from "./utils/auth-helper";
import { createTestApp, TestApp } from "./utils/test-app";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = iso(new Date());
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

describe("Atacado — resultado do período (e2e)", () => {
  let ctx: TestApp;
  let http: ReturnType<typeof request>;
  let token: string;
  let otherToken: string;
  const auth = () => bearer(token);

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    token = (await registerCompany(http, { email: "periodresult" })).accessToken;
    otherToken = (await registerCompany(http, { email: "periodresult-other" })).accessToken;
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await ctx.resetBusiness();
  });

  async function makeProduct(name: string) {
    const cat = (
      await http.post("/api/categories").set(auth()).send({ name: `Cat ${name}` }).expect(201)
    ).body;
    return (
      await http
        .post("/api/products")
        .set(auth())
        .send({
          categoryId: cat.id,
          name,
          unit: "MACO",
          defaultPurchasePrice: 15,
          defaultSalePrice: 25,
          currentUnitCost: 15,
        })
        .expect(201)
    ).body.id;
  }

  it("agrega vendas do atacado com lucro por pedido e por item, despesas por vencimento e líquido", async () => {
    const pid = await makeProduct("Rosa");
    const customer = (
      await http.post("/api/customers").set(auth()).send({ name: "Floricultura Bela" }).expect(201)
    ).body;

    // 2 pedidos no atacado dentro do período: (2 × 25, custo 2 × 15) e (1 × 30, custo 16)
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        customerId: customer.id,
        date: daysAgo(1),
        items: [{ productId: pid, quantity: 2, unitSalePrice: 25 }],
      })
      .expect(201);
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({
        channel: "WHOLESALE",
        date: today,
        items: [{ productId: pid, quantity: 1, unitSalePrice: 30, unitCost: 16 }],
      })
      .expect(201);
    // Varejo e cancelada não entram.
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "RETAIL", date: today, amount: 999, title: "Varejo" })
      .expect(201);
    const canceled = await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, amount: 500, title: "Cancelada" })
      .expect(201);
    await http.post(`/api/events/${canceled.body.id}/cancel`).set(auth()).expect(201);

    // Despesas: uma paga e uma em aberto no período; uma fora do período.
    const paidExp = await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Ajudante João", costCenter: "Salários", amount: 20, dueDate: daysAgo(2) })
      .expect(201);
    await http
      .post(`/api/expenses/${paidExp.body.id}/pay`)
      .set(auth())
      .send({ paymentMethod: "PIX" })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "DAS Simples", costCenter: "Impostos e taxas", amount: 5, dueDate: daysAgo(1) })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Fora", costCenter: "Aluguel", amount: 1000, dueDate: daysAgo(30) })
      .expect(201);

    const res = await http
      .get("/api/events/period-result")
      .query({ channel: "WHOLESALE", from: daysAgo(7), to: today })
      .set(auth())
      .expect(200);

    expect(res.body.defaultedPeriod).toBe(false);
    expect(res.body.sales).toEqual({
      count: 2,
      revenue: 80,
      cost: 46,
      grossProfit: 34,
      grossMargin: 42.5,
    });

    expect(res.body.orders).toHaveLength(2);
    const withCustomer = res.body.orders.find(
      (o: { customerName: string | null }) => o.customerName === "Floricultura Bela",
    );
    expect(withCustomer).toMatchObject({ soldValue: 50, cost: 30, profit: 20 });
    expect(withCustomer.items[0]).toMatchObject({
      quantity: 2,
      unitSalePrice: 25,
      unitCost: 15,
      lineTotal: 50,
      lineCost: 30,
      lineProfit: 20,
    });

    expect(res.body.expenses.total).toBe(25);
    expect(res.body.expenses.paidTotal).toBe(20);
    expect(res.body.expenses.unpaidTotal).toBe(5);
    expect(res.body.expenses.groups.map((g: { costCenter: string }) => g.costCenter)).toEqual([
      "Salários",
      "Impostos e taxas",
    ]);
    const unpaid = res.body.expenses.groups[1].entries[0];
    expect(unpaid).toMatchObject({ description: "DAS Simples", paid: false, overdue: true });

    expect(res.body.net).toEqual({ value: 9, margin: 11.25 });
  });

  it("sem período, usa o mês corrente e sinaliza defaultedPeriod", async () => {
    const res = await http
      .get("/api/events/period-result")
      .query({ channel: "WHOLESALE" })
      .set(auth())
      .expect(200);
    expect(res.body.defaultedPeriod).toBe(true);
    expect(res.body.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(res.body.sales.count).toBe(0);
    expect(res.body.sales.grossMargin).toBeNull();
    expect(res.body.net.margin).toBeNull();
  });

  it("não vaza dados de outra empresa", async () => {
    const pid = await makeProduct("Lírio");
    await http
      .post("/api/events/quick")
      .set(auth())
      .send({ channel: "WHOLESALE", date: today, items: [{ productId: pid, quantity: 1 }] })
      .expect(201);
    await http
      .post("/api/expenses")
      .set(auth())
      .send({ description: "Só minha", costCenter: "Outros", amount: 10, dueDate: today })
      .expect(201);

    const res = await http
      .get("/api/events/period-result")
      .query({ channel: "WHOLESALE", from: today, to: today })
      .set(bearer(otherToken))
      .expect(200);
    expect(res.body.sales.count).toBe(0);
    expect(res.body.expenses.total).toBe(0);
  });
});
```

Nota: se `POST /events/:id/cancel` devolver 200 em vez de 201, ajuste o `.expect`. Confira em `apps/api/test/events.e2e-spec.ts` (`grep -n "cancel" apps/api/test/events.e2e-spec.ts`).

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/api test:e2e -- period-result`
Expected: FAIL — 404 na rota (ou 400 pelo `ParseUUIDPipe` de `:id`, pois `period-result` casa com `GET :id`).

- [ ] **Step 3: Service**

`apps/api/src/modules/events/application/period-result.service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  PeriodResult,
  PeriodResultExpense,
  PeriodResultExpenseGroup,
  PeriodResultOrder,
  PeriodResultQuery,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney } from "../../../common/money/money";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ExpenseEntity } from "../../expenses/infrastructure/expense.entity";
import { EventEntity } from "../infrastructure/event.entity";

const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Margem em 0–100; null quando não há receita. */
function margin(value: number, revenue: number): number | null {
  return revenue > 0 ? roundMoney((value / revenue) * 100) : null;
}

/**
 * Resultado do período da tela Atacado: lucro por pedido/item (custo por item
 * gravado na venda), despesas lançadas por vencimento no período e líquido.
 *
 * Despesas não têm canal — são da empresa toda. A tela avisa isso.
 */
@Injectable()
export class PeriodResultService {
  constructor(
    private readonly tenant: TenantContextService,
    @InjectRepository(EventEntity)
    private readonly events: Repository<EventEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenses: Repository<ExpenseEntity>,
  ) {}

  private defaultRange(from?: string, to?: string) {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const monthEnd = localISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return {
      from: from ?? monthStart,
      to: to ?? monthEnd,
      defaulted: !from && !to,
    };
  }

  async generate(query: PeriodResultQuery): Promise<PeriodResult> {
    const cid = this.tenant.getCompanyIdOrThrow();
    const { from, to, defaulted } = this.defaultRange(query.from, query.to);

    const [orders, expenses] = await Promise.all([
      this.loadOrders(cid, { ...query, from, to }),
      this.loadExpenses(cid, from, to),
    ]);

    const revenue = roundMoney(orders.reduce((s, o) => s + o.soldValue, 0));
    const cost = roundMoney(orders.reduce((s, o) => s + o.cost, 0));
    const grossProfit = roundMoney(revenue - cost);
    const net = roundMoney(grossProfit - expenses.total);

    return {
      from,
      to,
      defaultedPeriod: defaulted,
      sales: {
        count: orders.length,
        revenue,
        cost,
        grossProfit,
        grossMargin: margin(grossProfit, revenue),
      },
      orders,
      expenses,
      net: { value: net, margin: margin(net, revenue) },
    };
  }

  /** Mesmos filtros da listagem (EventRepository.search), sem paginação, sem CANCELED. */
  private async loadOrders(
    cid: string,
    f: PeriodResultQuery & { from: string; to: string },
  ): Promise<PeriodResultOrder[]> {
    const qb = this.events
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.customer", "customer")
      .leftJoinAndSelect("event.items", "items")
      .where("event.company_id = :cid", { cid })
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .orderBy("event.date", "DESC")
      .addOrderBy("event.created_at", "DESC");

    if (f.channel) qb.andWhere("event.channel = :channel", { channel: f.channel });
    if (f.type) qb.andWhere("event.type = :type", { type: f.type });
    if (f.paymentStatus === "paid") {
      qb.andWhere("event.received_value >= event.sold_value");
    } else if (f.paymentStatus === "pending") {
      qb.andWhere("event.received_value < event.sold_value");
    } else if (f.paymentStatus === "overdue") {
      qb.andWhere("event.received_value < event.sold_value");
      qb.andWhere("event.date < CURRENT_DATE");
    }
    if (f.delivered === true) qb.andWhere("event.status = 'DONE'");
    else if (f.delivered === false)
      qb.andWhere("event.status IN ('CONFIRMED', 'IN_PROGRESS')");
    if (f.search) {
      qb.andWhere("(event.title ILIKE :s OR customer.name ILIKE :s)", {
        s: `%${f.search}%`,
      });
    }

    const rows = await qb.getMany();
    return rows.map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      customerName: e.customer?.name ?? null,
      soldValue: e.soldValue,
      cost: e.cost,
      profit: roundMoney(e.soldValue - e.cost),
      items: [...(e.items ?? [])]
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
        .map((i) => {
          const unitCost = i.unitCost ?? null;
          const lineCost = unitCost === null ? null : roundMoney(i.quantity * unitCost);
          return {
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitSalePrice: i.unitSalePrice,
            unitCost,
            lineTotal: i.lineTotal,
            lineCost,
            lineProfit: lineCost === null ? null : roundMoney(i.lineTotal - lineCost),
          };
        }),
    }));
  }

  /** Despesas por vencimento no período, agrupadas por centro de custo (maior total primeiro). */
  private async loadExpenses(
    cid: string,
    from: string,
    to: string,
  ): Promise<PeriodResult["expenses"]> {
    const rows = await this.expenses
      .createQueryBuilder("e")
      .where("e.company_id = :cid", { cid })
      .andWhere("e.due_date BETWEEN :from AND :to", { from, to })
      .orderBy("e.due_date", "ASC")
      .addOrderBy("e.created_at", "ASC")
      .getMany();

    const today = localISO(new Date());
    const byCenter = new Map<string, PeriodResultExpense[]>();
    for (const r of rows) {
      const entry: PeriodResultExpense = {
        id: r.id,
        description: r.description,
        amount: r.amount,
        dueDate: r.dueDate,
        paid: r.paid,
        overdue: !r.paid && r.dueDate < today,
      };
      const list = byCenter.get(r.costCenter) ?? [];
      list.push(entry);
      byCenter.set(r.costCenter, list);
    }

    const groups: PeriodResultExpenseGroup[] = [...byCenter.entries()]
      .map(([costCenter, entries]) => ({
        costCenter,
        total: roundMoney(entries.reduce((s, x) => s + x.amount, 0)),
        entries,
      }))
      .sort((a, b) => b.total - a.total);

    const total = roundMoney(rows.reduce((s, r) => s + r.amount, 0));
    const paidTotal = roundMoney(rows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0));
    return {
      total,
      paidTotal,
      unpaidTotal: roundMoney(total - paidTotal),
      groups,
    };
  }
}
```

Confira o nome da coluna de criação em `BaseEntity`/`TenantOwnedEntity` (`grep -n "created_at\|createdAt" apps/api/src/common/database/base.entity.ts`); use o nome real em `addOrderBy`.

- [ ] **Step 4: Controller e módulo**

Em `events.controller.ts`:
- import: `import { insightsQuerySchema, periodResultQuerySchema } from "@sistema-flores/types";` (substitui o import solto de `insightsQuerySchema`).
- `class PeriodResultQueryDto extends createZodDto(periodResultQuerySchema) {}`
- injetar `private readonly periodResult: PeriodResultService` no construtor (import de `../application/period-result.service`).
- Antes de `@Get(":id")` (ordem importa — senão `period-result` cai no `:id`):

```ts
  /** Resultado do período (Atacado): lucro por pedido/item, despesas e líquido. */
  @Get("period-result")
  @RequiresFeature("SALES")
  getPeriodResult(@Query() query: PeriodResultQueryDto) {
    return this.periodResult.generate(query);
  }
```

Em `events.module.ts`: adicionar `ExpenseEntity` ao `TypeOrmModule.forFeature([...])` (import de `../expenses/infrastructure/expense.entity`) e `PeriodResultService` em `providers`.

- [ ] **Step 5: Rodar e2e**

Run: `pnpm --filter @sistema-flores/api test:e2e -- period-result && pnpm --filter @sistema-flores/api typecheck && pnpm --filter @sistema-flores/api lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/events apps/api/test/period-result.e2e-spec.ts
git commit -m "feat(api): GET /events/period-result — lucro por pedido, despesas e líquido

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 4: Web — custo editável no carrinho do atacado

**Files:**
- Modify: `apps/web/src/lib/sale-units.ts`
- Create: `apps/web/src/lib/sale-units.test.ts`
- Modify: `apps/web/src/components/wholesale/wholesale-sale-dialog.tsx`
- Modify: `apps/web/src/components/events/edit-sale-items-dialog.tsx`

**Interfaces:**
- Consumes: `QuickSaleItem.unitCost` (Task 1); `Product.currentUnitCost`, `Product.defaultPurchasePrice`, `Product.packSize`.
- Produces: `suggestedUnitCost(p: UnitCosting, saleUnit?: ProductUnit): number` em `sale-units.ts`; `Sellable.cost` (custo por unidade de compra) e `CartItem.cost` no diálogo do atacado.

- [ ] **Step 1: Teste do helper**

`apps/web/src/lib/sale-units.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productPackCost, suggestedUnitCost } from "./sale-units";

describe("productPackCost", () => {
  it("usa o custo atual × packSize quando há custo atual", () => {
    expect(
      productPackCost({ currentUnitCost: 3, defaultPurchasePrice: 15, packSize: 5 }),
    ).toBe(15);
  });

  it("cai no preço de compra padrão quando o custo atual é zero", () => {
    expect(
      productPackCost({ currentUnitCost: 0, defaultPurchasePrice: 20, packSize: 10 }),
    ).toBe(20);
  });

  it("produto sem pacote: custo atual é o custo da unidade", () => {
    expect(
      productPackCost({ currentUnitCost: 4.5, defaultPurchasePrice: 4, packSize: 1 }),
    ).toBe(4.5);
  });
});

describe("suggestedUnitCost", () => {
  const rosa = { packSize: 5, purchaseUnit: "MACO", unit: "HASTE", price: 25, cost: 15 } as const;

  it("maço = custo cheio; haste = custo do maço ÷ packSize", () => {
    expect(suggestedUnitCost(rosa, "MACO")).toBe(15);
    expect(suggestedUnitCost(rosa, "HASTE")).toBe(3);
  });

  it("sem escolha de unidade devolve o custo direto", () => {
    expect(suggestedUnitCost({ packSize: 1, price: 10, cost: 6 })).toBe(6);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/web test -- sale-units`
Expected: FAIL — exports não existem.

- [ ] **Step 3: Implementar em `sale-units.ts`**

Adicionar ao final do arquivo:

```ts
/** Dados de custo do produto para sugerir o custo de uma linha. */
export interface UnitCosting extends UnitPricing {
  /** Custo por unidade de compra (ex.: custo do maço). */
  cost: number;
}

/**
 * Custo por unidade de compra: custo atual (por haste) × packSize; se o custo
 * atual estiver zerado, o preço de compra padrão (que já é por maço).
 */
export function productPackCost(p: {
  currentUnitCost: number;
  defaultPurchasePrice: number;
  packSize?: number;
}): number {
  const pack = p.packSize ?? 1;
  if (p.currentUnitCost > 0) return round2(p.currentUnitCost * pack);
  return p.defaultPurchasePrice;
}

/** Custo sugerido na unidade escolhida (mesma regra do preço: maço cheio, haste ÷ pacote). */
export function suggestedUnitCost(p: UnitCosting, saleUnit?: ProductUnit): number {
  if (!hasUnitChoice(p)) return p.cost;
  return saleUnit === p.purchaseUnit ? p.cost : round2(p.cost / (p.packSize ?? 1));
}
```

- [ ] **Step 4: Rodar teste**

Run: `pnpm --filter @sistema-flores/web test -- sale-units`
Expected: PASS.

- [ ] **Step 5: Diálogo do atacado — estado**

Em `wholesale-sale-dialog.tsx`:

1. Import: trocar o import de `@/lib/sale-units` por
```ts
import {
  defaultSaleUnit,
  hasUnitChoice,
  productPackCost,
  suggestedUnitCost,
  suggestedUnitPrice,
} from "@/lib/sale-units";
```
2. `Sellable`: adicionar `/** Custo por unidade de compra (maço). */ cost: number;` após `price`.
3. `CartItem`: adicionar `/** Custo praticado nesta venda, na unidade escolhida (editável). */ cost: number;` após `price`.
4. Em `sellables` (useMemo) e em `addCreatedProduct`, adicionar `cost: productPackCost(p)` / `cost: productPackCost(product)`.
5. Em `addSellable`, ao criar a linha: `cost: suggestedUnitCost(sellable, saleUnit),` logo após `price`.
6. Novo setter, após `setPrice`:
```ts
  const setCost = (id: string, cost: number) =>
    setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], cost } } : c));
```
7. Em `changeSaleUnit`, junto de `price`: `cost: suggestedUnitCost(c[id].sellable, saleUnit),`.
8. Após `const total = ...`:
```ts
  const totalCost = round(cartItems.reduce((s, i) => s + i.quantity * i.cost, 0));
  const estimatedProfit = round(total - totalCost);
```
9. No `submit`, em cada item: `unitCost: i.cost,`.

- [ ] **Step 6: Diálogo do atacado — UI da linha e rodapé**

Substituir o bloco "Preço unitário editável em linha própria" por:

```tsx
                      {/* Preço e custo unitários editáveis; lucro da linha ao vivo */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label
                            htmlFor={`price-${id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Preço{item.saleUnit ? `/${unitLabels[item.saleUnit]}` : ""}
                          </Label>
                          <CurrencyInput
                            id={`price-${id}`}
                            className="h-9"
                            value={item.price}
                            onChange={(v) => setPrice(id, v)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={`cost-${id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Custo{item.saleUnit ? `/${unitLabels[item.saleUnit]}` : ""}
                          </Label>
                          <CurrencyInput
                            id={`cost-${id}`}
                            className="h-9"
                            value={item.cost}
                            onChange={(v) => setCost(id, v)}
                          />
                        </div>
                      </div>
                      <p
                        className={cn(
                          "text-right text-xs tabular-nums",
                          item.price - item.cost < 0
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        Lucro da linha:{" "}
                        <span className="font-medium">
                          {formatCurrency(round(item.quantity * (item.price - item.cost)))}
                        </span>
                      </p>
```

Importar `cn` de `@/lib/utils` (já importa `formatCurrency, todayLocalISO`; acrescentar `cn`).

Localize onde o total do carrinho é exibido (`grep -n "formatCurrency(total)" apps/web/src/components/wholesale/wholesale-sale-dialog.tsx`) e logo abaixo dele adicione:

```tsx
            <p
              className={cn(
                "text-xs tabular-nums",
                estimatedProfit < 0 ? "text-destructive" : "text-muted-foreground",
              )}
              data-testid="ws-estimated-profit"
            >
              Lucro estimado: <span className="font-medium">{formatCurrency(estimatedProfit)}</span>
            </p>
```

Se o total estiver num `flex justify-between`, envolva total + lucro num `div` com `text-right` para manter o alinhamento.

- [ ] **Step 7: Editar itens preserva `unitCost`**

Em `edit-sale-items-dialog.tsx`:
- `CartItem` ganha `/** Custo unitário já gravado na venda (preservado, sem UI). */ unitCost?: number;`.
- Em `initialCart` (função que monta o carrinho a partir de `event.items`), na criação: `unitCost: item.unitCost ?? undefined,`.
- No `submit`, nos dois ramos do `map`, adicionar `unitCost: i.unitCost,`.

Assim, itens editados mantêm o custo ajustado; itens adicionados na edição vão sem `unitCost` e a API usa o custo do produto.

- [ ] **Step 8: Verificar**

Run: `pnpm --filter @sistema-flores/web typecheck && pnpm --filter @sistema-flores/web lint && pnpm --filter @sistema-flores/web test`
Expected: sem erros.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/sale-units.ts apps/web/src/lib/sale-units.test.ts apps/web/src/components/wholesale/wholesale-sale-dialog.tsx apps/web/src/components/events/edit-sale-items-dialog.tsx
git commit -m "feat(web): custo por item editável na venda do atacado com lucro ao vivo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 5: Web — "Esta semana" e setas no filtro de período

**Files:**
- Create: `apps/web/src/lib/week.ts`
- Create: `apps/web/src/lib/week.test.ts`
- Modify: `apps/web/src/components/shared/sales-filters.tsx`

**Interfaces:**
- Produces: `currentWeekRange(now?: Date): { from: string; to: string }`, `isWeekRange(from: string, to: string): boolean`, `shiftWeek(from: string, to: string, weeks: number): { from: string; to: string }`, `formatShortRange(from: string, to: string): string`.

- [ ] **Step 1: Teste**

`apps/web/src/lib/week.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { currentWeekRange, formatShortRange, isWeekRange, shiftWeek } from "./week";

describe("currentWeekRange", () => {
  it("segunda a domingo da semana da data (quinta 2026-09-03)", () => {
    expect(currentWeekRange(new Date(2026, 8, 3))).toEqual({
      from: "2026-08-31",
      to: "2026-09-06",
    });
  });

  it("domingo pertence à semana que começou na segunda anterior", () => {
    expect(currentWeekRange(new Date(2026, 8, 6))).toEqual({
      from: "2026-08-31",
      to: "2026-09-06",
    });
  });

  it("segunda começa a própria semana", () => {
    expect(currentWeekRange(new Date(2026, 8, 7))).toEqual({
      from: "2026-09-07",
      to: "2026-09-13",
    });
  });
});

describe("isWeekRange", () => {
  it("aceita seg→dom de 7 dias", () => {
    expect(isWeekRange("2026-08-31", "2026-09-06")).toBe(true);
  });
  it("rejeita 7 dias começando fora de segunda, ranges maiores e vazios", () => {
    expect(isWeekRange("2026-09-01", "2026-09-07")).toBe(false);
    expect(isWeekRange("2026-08-31", "2026-09-13")).toBe(false);
    expect(isWeekRange("", "")).toBe(false);
  });
});

describe("shiftWeek", () => {
  it("desloca 7 dias para trás e para frente", () => {
    expect(shiftWeek("2026-08-31", "2026-09-06", -1)).toEqual({
      from: "2026-08-24",
      to: "2026-08-30",
    });
    expect(shiftWeek("2026-08-31", "2026-09-06", 1)).toEqual({
      from: "2026-09-07",
      to: "2026-09-13",
    });
  });
});

describe("formatShortRange", () => {
  it("dd/mm – dd/mm", () => {
    expect(formatShortRange("2026-08-31", "2026-09-06")).toBe("31/08 – 06/09");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/web test -- week`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `week.ts`**

```ts
const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Semana de segunda a domingo (data local) que contém `now`. */
export function currentWeekRange(now: Date = new Date()): { from: string; to: string } {
  // getDay: 0=dom … 6=sáb → distância até a segunda anterior (dom = 6).
  const offset = (now.getDay() + 6) % 7;
  const monday = addDays(now, -offset);
  return { from: toIso(monday), to: toIso(addDays(monday, 6)) };
}

/** true quando `from`→`to` é exatamente uma semana seg→dom. */
export function isWeekRange(from: string, to: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return false;
  const start = fromIso(from);
  return start.getDay() === 1 && toIso(addDays(start, 6)) === to;
}

/** Desloca a semana em `weeks` (negativo = anterior). */
export function shiftWeek(from: string, to: string, weeks: number) {
  return { from: toIso(addDays(fromIso(from), weeks * 7)), to: toIso(addDays(fromIso(to), weeks * 7)) };
}

/** "31/08 – 06/09" — rótulo curto do chip de semana. */
export function formatShortRange(from: string, to: string): string {
  const f = fromIso(from);
  const t = fromIso(to);
  return `${pad(f.getDate())}/${pad(f.getMonth() + 1)} – ${pad(t.getDate())}/${pad(t.getMonth() + 1)}`;
}
```

- [ ] **Step 4: Rodar teste**

Run: `pnpm --filter @sistema-flores/web test -- week`
Expected: PASS.

- [ ] **Step 5: Filtro — preset e setas**

Em `sales-filters.tsx`:

1. Imports: `import { ChevronLeft, ChevronRight, Search } from "lucide-react";` e `import { currentWeekRange, formatShortRange, isWeekRange, shiftWeek } from "@/lib/week";`.
2. Em `presets()`, após `{ label: "Hoje", ... }`:
```ts
    { label: "Esta semana", ...currentWeekRange(now) },
```
3. No corpo do componente, após `activePreset`:
```ts
  const weekMode = isWeekRange(from, to);
  const otherWeek = weekMode && !activePreset;
  const goWeek = (delta: number) => {
    const next = shiftWeek(from, to, delta);
    onDateChange?.(next.from, next.to);
  };
```
4. Dentro do `div` que lista os presets (`options.map`), **antes** do map, renderizar a seta esquerda quando `weekMode`, e **depois** do map o chip de "outra semana" + seta direita:

```tsx
          {weekMode ? (
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => goWeek(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
          {options.map((p) => ( /* … inalterado … */ ))}
          {otherWeek ? (
            <span className="shrink-0 rounded-full border border-primary bg-primary/10 px-3.5 py-1.5 text-sm font-medium tabular-nums text-primary">
              {formatShortRange(from, to)}
            </span>
          ) : null}
          {weekMode ? (
            <button
              type="button"
              aria-label="Próxima semana"
              onClick={() => goWeek(1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
```

Os chips de preset têm `py-1.5` (~36px). Para os chips ficarem alinhados com as setas de 44px, troque o container dos chips para `items-center` (já é) e mantenha as setas em `h-11 w-11`; aceitável visualmente. Se ficar desalinhado, use `h-9 w-9` nas setas **e** envolva-as num `p-1` para manter a área de toque ≥ 44px.

- [ ] **Step 6: Verificar**

Run: `pnpm --filter @sistema-flores/web typecheck && pnpm --filter @sistema-flores/web lint && pnpm --filter @sistema-flores/web test`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/week.ts apps/web/src/lib/week.test.ts apps/web/src/components/shared/sales-filters.tsx
git commit -m "feat(web): preset Esta semana e navegação por semana no filtro de período

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 6: Web — hook `usePeriodResult` e modal "Resultado do período"

**Files:**
- Modify: `apps/web/src/lib/api/events.ts`
- Create: `apps/web/src/components/wholesale/period-result-dialog.tsx`
- Modify: `apps/web/src/app/(dashboard)/atacado/page.tsx`

**Interfaces:**
- Consumes: `PeriodResult` (Task 1); `GET /events/period-result` (Task 3); `SalesInsightsFilters` (já existe em `events.ts`).
- Produces: `usePeriodResult(filters: SalesInsightsFilters, enabled: boolean)`; `<PeriodResultDialog open onOpenChange filters />`.

- [ ] **Step 1: Hook**

Em `apps/web/src/lib/api/events.ts`, adicionar `PeriodResult` ao import de tipos e, após `useSalesInsights`:

```ts
/** Resultado do período (Atacado): lucro por pedido, despesas e líquido. */
export function usePeriodResult(filters: SalesInsightsFilters, enabled = true) {
  return useQuery({
    queryKey: [KEY, "period-result", filters],
    queryFn: () =>
      api.get<PeriodResult>("/events/period-result", {
        from: filters.from || undefined,
        to: filters.to || undefined,
        channel: filters.channel,
        type: filters.type,
        paymentStatus: filters.paymentStatus,
        delivered: filters.delivered,
        search: filters.search || undefined,
      }),
    staleTime: 60_000,
    enabled,
  });
}
```

- [ ] **Step 2: Modal**

`apps/web/src/components/wholesale/period-result-dialog.tsx`:

```tsx
"use client";

import type {
  PeriodResult,
  PeriodResultExpenseGroup,
  PeriodResultOrder,
} from "@sistema-flores/types";
import { ChevronDown, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriodResult, type SalesInsightsFilters } from "@/lib/api/events";
import { unitLabels } from "@/lib/labels";
import { cn, formatCurrency, formatDate, formatPercent } from "@/lib/utils";

const money = (v: number | null) => (v === null ? "—" : formatCurrency(v));

/**
 * Resultado do período da tela Atacado: vendas (receita, custo, lucro), lucro
 * por pedido e por item, despesas lançadas no período e o líquido.
 */
export function PeriodResultDialog({
  open,
  onOpenChange,
  filters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SalesInsightsFilters;
}) {
  const { data, isLoading } = usePeriodResult(filters, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Resultado do período</DialogTitle>
          <DialogDescription>
            {data
              ? `${formatDate(data.from)} até ${formatDate(data.to)}`
              : "Lucro das vendas, despesas lançadas e o que sobra."}
            {data?.defaultedPeriod
              ? " · Sem período escolhido: mostrando o mês atual."
              : null}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <SalesTiles sales={data.sales} />
            <OrdersSection orders={data.orders} />
            <ExpensesSection expenses={data.expenses} />
            <NetBlock data={data} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h3>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-xs tabular-nums text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function SalesTiles({ sales }: { sales: PeriodResult["sales"] }) {
  return (
    <section className="space-y-3">
      <SectionTitle icon={<ShoppingBag className="h-4 w-4" />} title="Vendas" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Pedidos" value={String(sales.count)} />
        <Tile label="Receita" value={formatCurrency(sales.revenue)} />
        <Tile label="Custo das flores" value={formatCurrency(sales.cost)} />
        <Tile
          label="Lucro bruto"
          value={formatCurrency(sales.grossProfit)}
          sub={sales.grossMargin === null ? undefined : `margem ${formatPercent(sales.grossMargin)}`}
          tone={sales.grossProfit < 0 ? "bad" : "good"}
        />
      </div>
    </section>
  );
}

function OrdersSection({ orders }: { orders: PeriodResultOrder[] }) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Receipt className="h-4 w-4" />}
        title="Por pedido"
        hint="Toque num pedido para ver o lucro de cada item."
      />
      {orders.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma venda no período.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {orders.map((o) => {
            const isOpen = Boolean(openIds[o.id]);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
                >
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.customerName ?? o.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.date)}</p>
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-3 text-right text-xs tabular-nums">
                    <span>
                      <span className="block text-muted-foreground">Venda</span>
                      {formatCurrency(o.soldValue)}
                    </span>
                    <span>
                      <span className="block text-muted-foreground">Custo</span>
                      {formatCurrency(o.cost)}
                    </span>
                    <span className={cn("font-semibold", o.profit < 0 && "text-destructive")}>
                      <span className="block font-normal text-muted-foreground">Lucro</span>
                      {formatCurrency(o.profit)}
                    </span>
                  </div>
                </button>
                {isOpen ? (
                  <div className="overflow-x-auto border-t border-border bg-muted/20 px-3 py-2">
                    {o.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Venda sem itens detalhados.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-muted-foreground">
                          <tr>
                            <th className="py-1 text-left font-normal">Item</th>
                            <th className="py-1 text-right font-normal">Qtd</th>
                            <th className="py-1 text-right font-normal">Custo un.</th>
                            <th className="py-1 text-right font-normal">Preço un.</th>
                            <th className="py-1 text-right font-normal">Lucro</th>
                          </tr>
                        </thead>
                        <tbody className="tabular-nums">
                          {o.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="py-1 pr-2">{it.description}</td>
                              <td className="py-1 text-right">
                                {it.quantity} {unitLabels[it.unit]}
                              </td>
                              <td className="py-1 text-right">{money(it.unitCost)}</td>
                              <td className="py-1 text-right">{formatCurrency(it.unitSalePrice)}</td>
                              <td className={cn("py-1 text-right font-medium", (it.lineProfit ?? 0) < 0 && "text-destructive")}>
                                {money(it.lineProfit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ExpensesSection({ expenses }: { expenses: PeriodResult["expenses"] }) {
  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Wallet className="h-4 w-4" />}
        title="Despesas do período"
        hint="Lançadas em Despesas, com vencimento no período. São de toda a empresa, não só do atacado."
      />
      {expenses.groups.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma despesa lançada no período.</p>
      ) : (
        <div className="space-y-3">
          {expenses.groups.map((g) => (
            <ExpenseGroup key={g.costCenter} group={g} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="font-medium">Total de despesas</span>
        <span className="text-right tabular-nums">
          <span className="font-semibold">{formatCurrency(expenses.total)}</span>
          {expenses.unpaidTotal > 0 ? (
            <span className="block text-xs text-muted-foreground">
              sendo {formatCurrency(expenses.unpaidTotal)} ainda em aberto
            </span>
          ) : null}
        </span>
      </div>
    </section>
  );
}

function ExpenseGroup({ group }: { group: PeriodResultExpenseGroup }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between bg-muted/30 px-3 py-2 text-sm">
        <span className="font-medium">{group.costCenter}</span>
        <span className="tabular-nums">{formatCurrency(group.total)}</span>
      </div>
      <ul className="divide-y divide-border">
        {group.entries.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate">{e.description}</p>
              <p className="text-xs text-muted-foreground">vence {formatDate(e.dueDate)}</p>
            </div>
            <Badge variant={e.paid ? "secondary" : e.overdue ? "destructive" : "outline"}>
              {e.paid ? "Paga" : e.overdue ? "Vencida" : "Em aberto"}
            </Badge>
            <span className="w-24 text-right tabular-nums">{formatCurrency(e.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NetBlock({ data }: { data: PeriodResult }) {
  const negative = data.net.value < 0;
  return (
    <section
      className={cn(
        "rounded-lg border p-4",
        negative ? "border-destructive/40 bg-destructive/5" : "border-primary/40 bg-primary/5",
      )}
      data-testid="period-net"
    >
      <dl className="space-y-1 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Lucro bruto das vendas</dt>
          <dd>{formatCurrency(data.sales.grossProfit)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Despesas do período</dt>
          <dd>− {formatCurrency(data.expenses.total)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-2">
          <dt className="text-base font-semibold">Resultado líquido</dt>
          <dd className={cn("text-xl font-semibold", negative && "text-destructive")}>
            {formatCurrency(data.net.value)}
          </dd>
        </div>
        {data.net.margin !== null ? (
          <p className="text-right text-xs text-muted-foreground">
            margem líquida {formatPercent(data.net.margin)}
          </p>
        ) : null}
      </dl>
    </section>
  );
}
```

Confira as variantes do `Badge` (`grep -n "variant" apps/web/src/components/ui/badge.tsx`); se não houver `secondary`/`destructive`/`outline`, use as que existirem com o mesmo sentido (neutra / erro / contorno).

- [ ] **Step 3: Botão na tela Atacado**

Em `apps/web/src/app/(dashboard)/atacado/page.tsx`:
- Imports: `Wallet` em `lucide-react`; `import { PeriodResultDialog } from "@/components/wholesale/period-result-dialog";`.
- Estado, junto de `expanded`: `const [resultOpen, setResultOpen] = useState(false);`.
- Extraia o objeto de filtros usado no `SalesInsightsPanel` para uma const antes do `return`:
```ts
  const insightFilters = {
    from,
    to,
    channel: "WHOLESALE" as const,
    paymentStatus: payment,
    delivered,
    search: debouncedSearch || undefined,
  };
```
e passe `filters={insightFilters}` ao `SalesInsightsPanel`.
- Transforme o `div` que envolve o botão "Insights do período" em um `div className="flex flex-wrap items-center gap-2"` contendo os dois botões, e mova o painel expandido para um irmão abaixo:

```tsx
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleInsights} className="…inalterado…">
            …
          </button>
          <button
            type="button"
            onClick={() => setResultOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Resultado do período
          </button>
        </div>
        {showInsights ? (
          <div className="mt-4">
            <SalesInsightsPanel filters={insightFilters} />
          </div>
        ) : null}
      </div>

      <PeriodResultDialog open={resultOpen} onOpenChange={setResultOpen} filters={insightFilters} />
```

- [ ] **Step 4: Verificar**

Run: `pnpm --filter @sistema-flores/web typecheck && pnpm --filter @sistema-flores/web lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api/events.ts apps/web/src/components/wholesale/period-result-dialog.tsx "apps/web/src/app/(dashboard)/atacado/page.tsx"
git commit -m "feat(web): modal Resultado do período no atacado (lucro, despesas e líquido)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 7: Playwright — semana, custo no carrinho e modal

**Files:**
- Create: `apps/web/e2e/atacado-resultado.spec.ts`

**Interfaces:**
- Consumes: tudo das tasks 2–6. Modelo de teste: `apps/web/e2e/atacado.spec.ts` (cadastro, `firebaseIdToken`, seed via API em `http://localhost:3001/api`).

- [ ] **Step 1: Escrever o teste**

```ts
import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

test("atacado: semana, custo por item e modal Resultado do período", async ({ page }) => {
  const stamp = Date.now();
  const email = `atacado_res_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Resultado");
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Rosas" } })
  ).json();
  await page.request.post(`${API}/products`, {
    headers: auth,
    data: {
      name: "Rosa Vermelha",
      categoryId: cat.id,
      unit: "MACO",
      defaultPurchasePrice: 15,
      defaultSalePrice: 25,
      currentUnitCost: 15,
      showInWholesale: true,
    },
  });
  const today = iso(new Date());
  await page.request.post(`${API}/expenses`, {
    headers: auth,
    data: { description: "Ajudante", costCenter: "Salários", amount: 4, dueDate: today },
  });

  // Venda no atacado com custo ajustado (compra a 16, vende a 25 → lucro 9).
  await page.goto("/atacado");
  await page.getByRole("button", { name: "Nova venda no atacado" }).click();
  await page.getByRole("button", { name: /Rosa Vermelha/ }).click();
  const costInput = page.getByLabel(/^Custo/);
  await costInput.fill("16");
  await expect(page.getByTestId("ws-estimated-profit")).toContainText("9,00");
  await page.getByRole("button", { name: /Registrar|Vender|Concluir/ }).last().click();
  await expect(page.getByText(/Venda registrada/)).toBeVisible();

  // Preset "Esta semana" seleciona seg→dom e as setas deslocam 7 dias.
  await page.getByRole("button", { name: "Esta semana" }).click();
  const from = page.getByLabel("Data inicial");
  const to = page.getByLabel("Data final");
  const weekFrom = await from.inputValue();
  expect(new Date(`${weekFrom}T12:00:00`).getDay()).toBe(1);
  await page.getByRole("button", { name: "Semana anterior" }).click();
  const prevFrom = await from.inputValue();
  expect(
    (new Date(`${weekFrom}T12:00:00`).getTime() - new Date(`${prevFrom}T12:00:00`).getTime()) /
      86_400_000,
  ).toBe(7);
  await page.getByRole("button", { name: "Próxima semana" }).click();
  await expect(from).toHaveValue(weekFrom);
  await expect(to).not.toHaveValue("");

  // Modal: lucro do pedido = 9, despesa 4, líquido 5.
  await page.getByRole("button", { name: "Resultado do período" }).click();
  const dialog = page.getByRole("dialog", { name: "Resultado do período" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Lucro bruto").locator("..")).toContainText("9,00");
  await expect(dialog.getByText("Ajudante")).toBeVisible();
  await expect(dialog.getByTestId("period-net")).toContainText("5,00");
});
```

Ajuste o nome do botão de confirmar venda conforme o texto real do diálogo (`grep -n "Button" apps/web/src/components/wholesale/wholesale-sale-dialog.tsx | tail -5`). Se `page.getByLabel(/^Custo/)` casar mais de um elemento, use `.first()`.

- [ ] **Step 2: Rodar**

Run: `pnpm --filter @sistema-flores/web exec playwright test e2e/atacado-resultado.spec.ts`
Expected: PASS (o config sobe API + Next; garanta que nada esteja ocupando as portas 3001/3000).

Se a venda registrada hoje cair fora da semana corrente (só acontece se o teste rodar em virada de dia), ignore; o assert do modal usa a semana corrente após voltar com "Próxima semana".

- [ ] **Step 3: Rodar os specs vizinhos para regressão**

Run: `pnpm --filter @sistema-flores/web exec playwright test e2e/atacado.spec.ts e2e/atacado-filtros.spec.ts e2e/vendas-filtros.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/atacado-resultado.spec.ts
git commit -m "test(web): e2e do resultado do período, semana e custo por item no atacado

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RdJ85oQYTjdwWYsQxar5NS"
```

---

### Task 8: Verificação final

- [ ] **Step 1: Suíte completa de unit/typecheck/lint**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: tudo verde.

- [ ] **Step 2: E2E da API completo**

Run: `pnpm --filter @sistema-flores/api test:e2e`
Expected: PASS (atenção a asserts de `cost` em `events.e2e-spec.ts`, ver Task 2 Step 7).

- [ ] **Step 3: Revisar `git log --oneline -8` e `git status` limpo. Não fazer push.**
