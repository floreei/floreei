# Insights filtráveis, entregas pendentes e persistência de filtros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer os "Insights do período" reagirem a todos os filtros da tela, adicionar a seção "Falta entregar" (flores pendentes por cliente), expor os itens da venda direto na listagem do atacado (linha expansível) e persistir os filtros na URL para sobreviverem ao ir-e-voltar do detalhe.

**Architecture:** Monorepo pnpm+turbo. Tipos compartilhados em `packages/types` (Zod). API NestJS + TypeORM (Postgres) em `apps/api` — insights em `SalesInsightsService`, lista em `EventRepository.search`. Web Next.js App Router + React Query em `apps/web` — telas `/vendas` e `/atacado`, painel `SalesInsightsPanel`.

**Tech Stack:** TypeScript, Zod, NestJS, TypeORM, Next.js 14 (App Router), TanStack Query, Tailwind, lucide-react, Jest (e2e API), Vitest (types), Playwright (web).

**Spec:** `docs/superpowers/specs/2026-08-12-insights-filtros-entregas-design.md`

## Global Constraints

- Interface em pt-BR; público inclui leigos — alvos de toque ≥44px, ícones lucide, sem emoji na UI.
- Valores monetários com `formatCurrency` e `tabular-nums`; dinheiro no backend com `roundMoney`.
- Isolamento multi-tenant: toda query de evento filtra `company_id` (usar `EventRepository.qb()` / `TenantContextService`).
- Query params da URL em pt-BR: `busca`, `pagamento` (`paid|pending`), `entrega` (`sim|nao`), `de`, `ate`, `pagina`, `tipo` (só /vendas), `insights` (`1`).
- Commits frequentes, mensagens em pt-BR estilo conventional commits (`feat:`, `test:`…), com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Tipos — query de insights estendida + `PendingDeliveries`

**Files:**
- Modify: `packages/types/src/event.ts` (bloco `insightsQuerySchema`, linhas ~154-160)
- Modify: `packages/types/src/insights.ts`
- Test: `packages/types/src/event.test.ts` (novo)

**Interfaces:**
- Consumes: `paymentStatusFilterSchema`, `eventTypeSchema`, `salesChannelSchema`, `ProductUnit` (já existem em `packages/types`).
- Produces: `insightsQuerySchema`/`InsightsQuery` com campos novos `type`, `paymentStatus`, `delivered`, `search`; interfaces `PendingDeliveryItem`, `PendingDeliveryCustomer`, `PendingDeliveries`; `SalesInsights.pendingDeliveries: PendingDeliveries`. Tasks 2 e 4 dependem exatamente desses nomes.

- [ ] **Step 1: Escrever o teste que falha**

Criar `packages/types/src/event.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { insightsQuerySchema } from "./event";

describe("insightsQuerySchema", () => {
  it("aceita os filtros da tela além do período", () => {
    const parsed = insightsQuerySchema.parse({
      from: "2026-08-01",
      to: "2026-08-31",
      channel: "WHOLESALE",
      type: "ORDER",
      paymentStatus: "pending",
      delivered: "false",
      search: "  Mercado ",
    });
    expect(parsed.paymentStatus).toBe("pending");
    expect(parsed.delivered).toBe(false);
    expect(parsed.type).toBe("ORDER");
    expect(parsed.search).toBe("Mercado");
  });

  it("rejeita paymentStatus inválido", () => {
    expect(() =>
      insightsQuerySchema.parse({ paymentStatus: "xyz" }),
    ).toThrow();
  });

  it("continua aceitando só período e canal (compat)", () => {
    const parsed = insightsQuerySchema.parse({ channel: "RETAIL" });
    expect(parsed.delivered).toBeUndefined();
    expect(parsed.search).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/types test -- event.test`
Expected: FAIL — `delivered`/`paymentStatus` são unknown keys (schema atual não tem os campos; parse os descarta e o `toBe(false)`/`toBe("pending")` falha).

- [ ] **Step 3: Implementar os tipos**

Em `packages/types/src/event.ts`, substituir o bloco do `insightsQuerySchema`:

```ts
/** Filtro dos insights de venda — período + os mesmos filtros da listagem. */
export const insightsQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  channel: salesChannelSchema.optional(),
  type: eventTypeSchema.optional(),
  paymentStatus: paymentStatusFilterSchema.optional(),
  /** true ⇒ só entregues (DONE); false ⇒ só "a entregar" (CONFIRMED/IN_PROGRESS). */
  delivered: z.preprocess(
    (v) => (v === "true" ? true : v === "false" ? false : v),
    z.boolean().optional(),
  ),
  search: z.string().trim().max(120).optional(),
});
export type InsightsQuery = z.infer<typeof insightsQuerySchema>;
```

Em `packages/types/src/insights.ts`, adicionar no topo `import type { ProductUnit } from "./enums";` e, antes de `SalesInsights`:

```ts
/** Item (produto ou buquê) pendente de entrega, com quantidade somada. */
export interface PendingDeliveryItem {
  id: string;
  name: string;
  kind: "product" | "arrangement";
  quantity: number;
  unit: ProductUnit;
}

/** Cliente com vendas a entregar no período (null = venda sem cliente). */
export interface PendingDeliveryCustomer {
  id: string | null;
  name: string | null;
  salesCount: number;
  items: PendingDeliveryItem[];
}

/** Consolidado do que falta entregar no período filtrado. */
export interface PendingDeliveries {
  /** Vendas confirmadas/em andamento (não entregues, não canceladas). */
  salesCount: number;
  /** Soma das quantidades de todos os itens pendentes (unidades mistas). */
  totalQuantity: number;
  /** Ordenado por quantidade pendente (desc). */
  customers: PendingDeliveryCustomer[];
}
```

E em `SalesInsights` acrescentar o campo:

```ts
export interface SalesInsights {
  from: string;
  to: string;
  topItems: SoldItemRanking[];
  idleItems: IdleItem[];
  topCustomers: PartyRanking[];
  atRiskCustomers: AtRiskCustomer[];
  pendingDeliveries: PendingDeliveries;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm --filter @sistema-flores/types test`
Expected: PASS (novo teste e suíte existente).

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/event.ts packages/types/src/insights.ts packages/types/src/event.test.ts
git commit -m "feat(types): filtros completos no insightsQuerySchema e tipos de entregas pendentes"
```

---

### Task 2: API — insights respeitam filtros + `pendingDeliveries`

**Files:**
- Modify: `apps/api/src/modules/events/application/sales-insights.service.ts`
- Modify: `apps/api/src/modules/events/presentation/events.controller.ts:50-54`
- Test: `apps/api/test/sales-insights.e2e-spec.ts` (acrescentar `it`s)

**Interfaces:**
- Consumes: `InsightsQuery`, `PendingDeliveries`, `PendingDeliveryCustomer`, `PendingDeliveryItem` (Task 1); `EventRepository.qb()`; repositório `EventItemEntity`.
- Produces: `SalesInsightsService.generate(query: InsightsQuery): Promise<SalesInsights>` — resposta do `GET /events/insights` ganha `pendingDeliveries`. Task 4 consome esse payload.

- [ ] **Step 1: Escrever os testes e2e que falham**

Acrescentar em `apps/api/test/sales-insights.e2e-spec.ts` (dentro do `describe` existente):

```ts
it("pendingDeliveries agrega itens não entregues por cliente", async () => {
  const cat = await (
    await http.post("/api/categories").set(auth()).send({ name: "Rosas P" }).expect(201)
  ).body;
  const prod = await (
    await http
      .post("/api/products")
      .set(auth())
      .send({ categoryId: cat.id, name: "Rosa Colombiana", unit: "MACO", defaultSalePrice: 30 })
      .expect(201)
  ).body;
  const customer = await (
    await http.post("/api/customers").set(auth()).send({ name: "Mercado Central" }).expect(201)
  ).body;

  // Pendente: 5 maços para o Mercado Central.
  await http
    .post("/api/events/quick")
    .set(auth())
    .send({
      channel: "WHOLESALE",
      customerId: customer.id,
      items: [{ productId: prod.id, quantity: 5, unitSalePrice: 25 }],
    })
    .expect(201);
  // Entregue: não pode aparecer nas pendências.
  await http
    .post("/api/events/quick")
    .set(auth())
    .send({
      channel: "WHOLESALE",
      delivered: true,
      items: [{ productId: prod.id, quantity: 9, unitSalePrice: 25 }],
    })
    .expect(201);

  const res = await http
    .get("/api/events/insights")
    .query({ channel: "WHOLESALE" })
    .set(auth())
    .expect(200);

  const pd = res.body.pendingDeliveries;
  expect(pd.salesCount).toBe(1);
  expect(pd.totalQuantity).toBe(5);
  expect(pd.customers).toHaveLength(1);
  expect(pd.customers[0]).toMatchObject({
    id: customer.id,
    name: "Mercado Central",
    salesCount: 1,
  });
  expect(pd.customers[0].items).toEqual([
    expect.objectContaining({
      id: prod.id,
      name: "Rosa Colombiana",
      kind: "product",
      quantity: 5,
      unit: "MACO",
    }),
  ]);
});

it("pendingDeliveries agrupa venda sem cliente e sem itens (valor livre)", async () => {
  await http
    .post("/api/events/quick")
    .set(auth())
    .send({ amount: 80, title: "Avulsa pendente", channel: "RETAIL" })
    .expect(201);

  const res = await http
    .get("/api/events/insights")
    .query({ channel: "RETAIL" })
    .set(auth())
    .expect(200);

  const pd = res.body.pendingDeliveries;
  expect(pd.salesCount).toBe(1);
  expect(pd.totalQuantity).toBe(0);
  expect(pd.customers[0]).toMatchObject({ id: null, salesCount: 1, items: [] });
});

it("insights respeitam paymentStatus e search", async () => {
  const cat = await (
    await http.post("/api/categories").set(auth()).send({ name: "Lírios F" }).expect(201)
  ).body;
  const mkProd = async (name: string) =>
    (
      await http
        .post("/api/products")
        .set(auth())
        .send({ categoryId: cat.id, name, unit: "MACO", defaultSalePrice: 20 })
        .expect(201)
    ).body.id;
  const pagoId = await mkProd("Lírio Pago");
  const prazoId = await mkProd("Lírio Prazo");
  const ana = await (
    await http.post("/api/customers").set(auth()).send({ name: "Ana Flores" }).expect(201)
  ).body;
  const beto = await (
    await http.post("/api/customers").set(auth()).send({ name: "Beto Buquês" }).expect(201)
  ).body;

  const paga = await http
    .post("/api/events/quick")
    .set(auth())
    .send({
      channel: "RETAIL",
      customerId: ana.id,
      items: [{ productId: pagoId, quantity: 2, unitSalePrice: 20 }],
    })
    .expect(201);
  await http
    .post(`/api/finance/events/${paga.body.id}/payments`)
    .set(auth())
    .send({ amount: 40, method: "PIX" })
    .expect(201);
  await http
    .post("/api/events/quick")
    .set(auth())
    .send({
      channel: "RETAIL",
      customerId: beto.id,
      items: [{ productId: prazoId, quantity: 3, unitSalePrice: 20 }],
    })
    .expect(201);

  // paymentStatus=paid: só o item da venda quitada aparece no ranking.
  const paid = await http
    .get("/api/events/insights")
    .query({ channel: "RETAIL", paymentStatus: "paid" })
    .set(auth())
    .expect(200);
  const paidIds = paid.body.topItems.map((i: { id: string }) => i.id);
  expect(paidIds).toContain(pagoId);
  expect(paidIds).not.toContain(prazoId);
  const paidCustomers = paid.body.topCustomers.map((c: { id: string }) => c.id);
  expect(paidCustomers).toContain(ana.id);
  expect(paidCustomers).not.toContain(beto.id);

  // search por nome do cliente restringe rankings e pendências.
  const searched = await http
    .get("/api/events/insights")
    .query({ channel: "RETAIL", search: "Beto" })
    .set(auth())
    .expect(200);
  const sIds = searched.body.topItems.map((i: { id: string }) => i.id);
  expect(sIds).toContain(prazoId);
  expect(sIds).not.toContain(pagoId);
  expect(searched.body.pendingDeliveries.customers.map((c: { id: string | null }) => c.id)).toEqual([
    beto.id,
  ]);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/api test:e2e -- --testPathPattern sales-insights`
Expected: FAIL — `pendingDeliveries` é `undefined` e os filtros novos são ignorados.
(Pré-requisito: Postgres/Firebase de teste de pé — `docker-compose up -d` na raiz se necessário.)

- [ ] **Step 3: Implementar service + controller**

Em `events.controller.ts`, trocar o handler:

```ts
  /** Insights práticos da tela de Vendas (mais/parados, top/em risco, entregas). */
  @Get("insights")
  @RequiresFeature("SALES")
  getInsights(@Query() query: InsightsQueryDto) {
    return this.insights.generate(query);
  }
```

Em `sales-insights.service.ts`:

1. Ajustar imports:

```ts
import type {
  AtRiskCustomer,
  IdleItem,
  InsightsQuery,
  PartyRanking,
  PendingDeliveries,
  PendingDeliveryCustomer,
  SalesChannel,
  SalesInsights,
  ProductUnit,
  SoldItemRanking,
} from "@sistema-flores/types";
import type { SelectQueryBuilder } from "typeorm";
```

2. Tipo interno dos filtros (logo após os imports):

```ts
/** Filtros normalizados (período resolvido) aplicados às queries de insight. */
type InsightsFilters = Omit<InsightsQuery, "from" | "to"> & {
  from: string;
  to: string;
};
```

3. Reescrever `generate` e adicionar o aplicador de filtros:

```ts
  async generate(query: InsightsQuery): Promise<SalesInsights> {
    const { from, to } = this.defaultRange(query.from, query.to);
    const f: InsightsFilters = { ...query, from, to };
    const [topItems, idleItems, topCustomers, atRiskCustomers, pendingDeliveries] =
      await Promise.all([
        this.topItems(f),
        this.idleItems(from, to, query.channel),
        this.topCustomers(f),
        this.atRiskCustomers(from, query.channel),
        this.pendingDeliveries(f),
      ]);
    return {
      from,
      to,
      topItems,
      idleItems,
      topCustomers,
      atRiskCustomers,
      pendingDeliveries,
    };
  }

  /**
   * Filtros da listagem aplicados a uma query com alias `event` (e `customer`
   * joinado quando houver busca). Mesmas cláusulas do EventRepository.search.
   * `delivered` pode ser ignorado (seção "falta entregar" já fixa o status).
   */
  private applyListFilters(
    qb: SelectQueryBuilder<any>,
    f: InsightsFilters,
    opts: { skipDelivered?: boolean } = {},
  ): void {
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
    if (!opts.skipDelivered) {
      if (f.delivered === true) qb.andWhere("event.status = 'DONE'");
      else if (f.delivered === false)
        qb.andWhere("event.status IN ('CONFIRMED', 'IN_PROGRESS')");
    }
    if (f.search) {
      qb.andWhere("(event.title ILIKE :s OR customer.name ILIKE :s)", {
        s: `%${f.search}%`,
      });
    }
  }
```

4. `topItems` passa a receber `f: InsightsFilters` (trocar assinatura e o corpo que aplicava canal):

```ts
  /** Itens (insumo ou buquê) mais vendidos no período, por quantidade. */
  private async topItems(f: InsightsFilters): Promise<SoldItemRanking[]> {
    const cid = this.tenant.getCompanyIdOrThrow();
    const kindExpr =
      "CASE WHEN ei.product_id IS NOT NULL THEN 'product' ELSE 'arrangement' END";
    const qb = this.items
      .createQueryBuilder("ei")
      .innerJoin("ei.event", "event")
      .leftJoin("event.customer", "customer")
      .select("COALESCE(ei.product_id, ei.arrangement_id)", "id")
      .addSelect("MAX(ei.description)", "name")
      .addSelect(kindExpr, "kind")
      .addSelect("SUM(ei.quantity)", "quantity")
      .addSelect("SUM(ei.line_total)", "revenue")
      .where("event.company_id = :cid", { cid })
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .andWhere("COALESCE(ei.product_id, ei.arrangement_id) IS NOT NULL");
    this.applyListFilters(qb, f);
    const rows = await qb
      .groupBy("COALESCE(ei.product_id, ei.arrangement_id)")
      .addGroupBy(kindExpr)
      .orderBy("quantity", "DESC")
      .limit(5)
      .getRawMany<{
        id: string;
        name: string;
        kind: "product" | "arrangement";
        quantity: string;
        revenue: string;
      }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      quantity: Number(r.quantity) || 0,
      revenue: roundMoney(Number(r.revenue ?? 0)),
    }));
  }
```

5. `topCustomers` idem (o `channel` sai da assinatura, entra `f`):

```ts
  /** Clientes que mais compraram no período (por receita). */
  private async topCustomers(f: InsightsFilters): Promise<PartyRanking[]> {
    const qb = this.events
      .qb("event")
      .innerJoin("event.customer", "customer")
      .select("customer.id", "id")
      .addSelect("customer.name", "name")
      .addSelect("COALESCE(SUM(event.sold_value),0)", "total")
      .addSelect("COUNT(*)", "count")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to });
    this.applyListFilters(qb, f);
    const rows = await qb
      .groupBy("customer.id")
      .addGroupBy("customer.name")
      .orderBy("total", "DESC")
      .limit(5)
      .getRawMany<{ id: string; name: string; total: string; count: string }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      total: roundMoney(Number(r.total ?? 0)),
      count: Number(r.count ?? 0),
    }));
  }
```

6. Novo método `pendingDeliveries` (duas queries: contagem de vendas pendentes por cliente + itens agregados por cliente×item×unidade; ignora `delivered` de propósito):

```ts
  /**
   * O que falta entregar no período: vendas CONFIRMED/IN_PROGRESS agrupadas
   * por cliente, com as quantidades por item. Ignora o filtro `delivered`
   * (a seção já é, por definição, "não entregue").
   */
  private async pendingDeliveries(f: InsightsFilters): Promise<PendingDeliveries> {
    const pendingWhere = "event.status IN ('CONFIRMED', 'IN_PROGRESS')";

    const salesQb = this.events
      .qb("event")
      .leftJoin("event.customer", "customer")
      .select("customer.id", "customerId")
      .addSelect("MAX(customer.name)", "customerName")
      .addSelect("COUNT(*)", "salesCount")
      .andWhere(pendingWhere)
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to });
    this.applyListFilters(salesQb, f, { skipDelivered: true });
    const sales = await salesQb
      .groupBy("customer.id")
      .getRawMany<{
        customerId: string | null;
        customerName: string | null;
        salesCount: string;
      }>();

    const cid = this.tenant.getCompanyIdOrThrow();
    const kindExpr =
      "CASE WHEN ei.product_id IS NOT NULL THEN 'product' ELSE 'arrangement' END";
    const itemsQb = this.items
      .createQueryBuilder("ei")
      .innerJoin("ei.event", "event")
      .leftJoin("event.customer", "customer")
      .select("customer.id", "customerId")
      .addSelect("COALESCE(ei.product_id, ei.arrangement_id)", "id")
      .addSelect("MAX(ei.description)", "name")
      .addSelect(kindExpr, "kind")
      .addSelect("ei.unit", "unit")
      .addSelect("SUM(ei.quantity)", "quantity")
      .where("event.company_id = :cid", { cid })
      .andWhere(pendingWhere)
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .andWhere("COALESCE(ei.product_id, ei.arrangement_id) IS NOT NULL");
    this.applyListFilters(itemsQb, f, { skipDelivered: true });
    const items = await itemsQb
      .groupBy("customer.id")
      .addGroupBy("COALESCE(ei.product_id, ei.arrangement_id)")
      .addGroupBy(kindExpr)
      .addGroupBy("ei.unit")
      .getRawMany<{
        customerId: string | null;
        id: string;
        name: string;
        kind: "product" | "arrangement";
        unit: string;
        quantity: string;
      }>();

    const byCustomer = new Map<string, PendingDeliveryCustomer>();
    const keyOf = (id: string | null) => id ?? "__none__";
    for (const s of sales) {
      byCustomer.set(keyOf(s.customerId), {
        id: s.customerId ?? null,
        name: s.customerName ?? null,
        salesCount: Number(s.salesCount) || 0,
        items: [],
      });
    }
    let totalQuantity = 0;
    for (const it of items) {
      const entry = byCustomer.get(keyOf(it.customerId));
      if (!entry) continue;
      const quantity = Number(it.quantity) || 0;
      totalQuantity += quantity;
      entry.items.push({
        id: it.id,
        name: it.name,
        kind: it.kind,
        quantity,
        unit: it.unit as ProductUnit,
      });
    }

    const customers = [...byCustomer.values()];
    for (const c of customers) c.items.sort((a, b) => b.quantity - a.quantity);
    customers.sort(
      (a, b) =>
        b.items.reduce((s, i) => s + i.quantity, 0) -
        a.items.reduce((s, i) => s + i.quantity, 0),
    );

    return {
      salesCount: sales.reduce((s, r) => s + (Number(r.salesCount) || 0), 0),
      totalQuantity,
      customers,
    };
  }
```

Observação: `qb("event")` do `TenantScopedRepository` já aplica `company_id`; a query de itens (repo direto do TypeORM) precisa do `where company_id` explícito — como acima.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm --filter @sistema-flores/api test:e2e -- --testPathPattern sales-insights`
Expected: PASS (testes novos e antigos — os antigos validam a compatibilidade da assinatura nova).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/events apps/api/test/sales-insights.e2e-spec.ts
git commit -m "feat(api): insights respeitam filtros da listagem e agregam entregas pendentes"
```

---

### Task 3: API — listagem de eventos carrega os itens

**Files:**
- Modify: `apps/api/src/modules/events/infrastructure/event.repository.ts:34`
- Test: `apps/api/test/events.e2e-spec.ts` (acrescentar 1 `it`)

**Interfaces:**
- Consumes: nada novo.
- Produces: `GET /events` passa a devolver `data[].items: EventItem[]` preenchido (o mapper `toEvent` já serializa `items` — hoje vem `[]` porque a lista não faz o join). Task 6 consome `event.items` na listagem do atacado.

- [ ] **Step 1: Escrever o teste que falha**

Em `apps/api/test/events.e2e-spec.ts`, adicionar no `describe` principal (seguir o padrão de auth/setup do arquivo — usa os mesmos helpers `bearer`/`registerCompany` da suíte):

```ts
it("GET /events devolve os itens de cada venda na listagem", async () => {
  const cat = await (
    await http.post("/api/categories").set(auth()).send({ name: "Astromélias L" }).expect(201)
  ).body;
  const prod = await (
    await http
      .post("/api/products")
      .set(auth())
      .send({ categoryId: cat.id, name: "Astromélia", unit: "MACO", defaultSalePrice: 15 })
      .expect(201)
  ).body;
  await http
    .post("/api/events/quick")
    .set(auth())
    .send({
      channel: "WHOLESALE",
      items: [{ productId: prod.id, quantity: 4, unitSalePrice: 12 }],
    })
    .expect(201);

  const res = await http
    .get("/api/events")
    .query({ channel: "WHOLESALE" })
    .set(auth())
    .expect(200);
  const withItems = res.body.data.find(
    (e: { items: Array<{ description: string }> }) => e.items?.length > 0,
  );
  expect(withItems).toBeTruthy();
  expect(withItems.items[0]).toMatchObject({
    description: "Astromélia",
    quantity: 4,
    unit: "MACO",
  });
});
```

(Se o `describe` existente não tiver `auth()`/`http` com esses nomes, adaptar às variáveis do arquivo — o padrão da suíte é o mesmo de `sales-insights.e2e-spec.ts`.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/api test:e2e -- --testPathPattern "events\.e2e"`
Expected: FAIL — `items` vem `[]` na listagem.

- [ ] **Step 3: Implementar**

Em `event.repository.ts`, no `search()`, trocar a primeira linha do query builder:

```ts
    const qb = this.qb("event")
      .leftJoinAndSelect("event.customer", "customer")
      .leftJoinAndSelect("event.items", "items");
```

(Paginação segue correta: com join 1:N o TypeORM resolve `skip/take` via subquery de ids distintos.)

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm --filter @sistema-flores/api test:e2e -- --testPathPattern "events\.e2e"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/events/infrastructure/event.repository.ts apps/api/test/events.e2e-spec.ts
git commit -m "feat(api): listagem de eventos inclui os itens de cada venda"
```

---

### Task 4: Web — hook de insights com filtros + seção "Falta entregar" no painel

**Files:**
- Modify: `apps/web/src/lib/api/events.ts:46-62` (`useSalesInsights`)
- Modify: `apps/web/src/components/events/sales-insights-panel.tsx`
- Modify: `apps/web/src/app/(dashboard)/atacado/page.tsx:163-168` (props do painel)
- Modify: `apps/web/src/app/(dashboard)/vendas/page.tsx:192-197` (props do painel)

**Interfaces:**
- Consumes: payload `SalesInsights.pendingDeliveries` (Task 2); `unitLabels` de `@/lib/labels`.
- Produces: `useSalesInsights(filters: SalesInsightsFilters)` e `SalesInsightsPanel({ filters }: { filters: SalesInsightsFilters })`, com `SalesInsightsFilters` exportado de `@/lib/api/events`:

```ts
export interface SalesInsightsFilters {
  from?: string;
  to?: string;
  channel?: SalesChannel;
  type?: EventType;
  paymentStatus?: PaymentStatusFilter;
  delivered?: boolean;
  search?: string;
}
```

Task 5 monta esse objeto nas páginas.

- [ ] **Step 1: Atualizar o hook**

Em `apps/web/src/lib/api/events.ts`, importar também `EventType` e `PaymentStatusFilter` de `@sistema-flores/types` e substituir `useSalesInsights`:

```ts
/** Filtros do painel de insights — os mesmos da listagem de vendas. */
export interface SalesInsightsFilters {
  from?: string;
  to?: string;
  channel?: SalesChannel;
  type?: EventType;
  paymentStatus?: PaymentStatusFilter;
  delivered?: boolean;
  search?: string;
}

/** Insights práticos da tela de Vendas, respeitando período e filtros. */
export function useSalesInsights(filters: SalesInsightsFilters) {
  return useQuery({
    queryKey: [KEY, "insights", filters],
    queryFn: () =>
      api.get<SalesInsights>("/events/insights", {
        from: filters.from || undefined,
        to: filters.to || undefined,
        channel: filters.channel,
        type: filters.type,
        paymentStatus: filters.paymentStatus,
        delivered: filters.delivered,
        search: filters.search || undefined,
      }),
    staleTime: 60_000,
  });
}
```

- [ ] **Step 2: Painel — nova seção e props**

Em `sales-insights-panel.tsx`:

1. Imports adicionais: `Truck` de lucide-react, `PendingDeliveries` de `@sistema-flores/types`, `unitLabels` de `@/lib/labels`, e `type SalesInsightsFilters` + `useSalesInsights` de `@/lib/api/events` (o import de `SalesChannel` pode sair).
2. Assinatura do componente:

```tsx
/** Insights práticos da tela de Vendas, respeitando período e filtros da tela. */
export function SalesInsightsPanel({ filters }: { filters: SalesInsightsFilters }) {
  const { data, isLoading } = useSalesInsights(filters);
```

3. Dentro do grid (`<div className="grid gap-4 lg:grid-cols-2">`), adicionar como PRIMEIRO card (largura total — a informação mais acionável fica no topo):

```tsx
      <Card className="space-y-4 p-5 lg:col-span-2">
        <SectionTitle
          icon={<Truck className="h-4 w-4" />}
          title="Falta entregar"
          hint="Vendas confirmadas ainda não entregues no período — por cliente."
        />
        <PendingDeliveriesList data={data?.pendingDeliveries} loading={isLoading} />
      </Card>
```

4. Novo componente no fim do arquivo:

```tsx
function PendingDeliveriesList({
  data,
  loading,
}: {
  data: PendingDeliveries | undefined;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (data.salesCount === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nada pendente de entrega no período.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {data.totalQuantity}
        </span>{" "}
        {data.totalQuantity === 1 ? "item" : "itens"} em{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {data.salesCount}
        </span>{" "}
        {data.salesCount === 1 ? "entrega" : "entregas"}
      </p>
      <ul className="divide-y divide-border">
        {data.customers.map((c) => (
          <li key={c.id ?? "sem-cliente"} className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium">
                {c.name ?? "Sem cliente"}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {c.salesCount} {c.salesCount === 1 ? "entrega" : "entregas"}
              </span>
            </div>
            {c.items.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                {c.items.map((item) => (
                  <li
                    key={`${item.kind}:${item.id}:${item.unit}`}
                    className="text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground tabular-nums">
                      {item.quantity}
                    </span>{" "}
                    {(unitLabels[item.unit] ?? item.unit).toLowerCase()}
                    {item.quantity === 1 ? "" : "s"} — {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Venda de valor livre (sem itens detalhados).
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Ajustar as duas páginas para a nova prop**

Em `atacado/page.tsx` (linha ~165):

```tsx
            <SalesInsightsPanel
              filters={{
                from,
                to,
                channel: "WHOLESALE",
                paymentStatus: payment,
                delivered,
                search: debouncedSearch || undefined,
              }}
            />
```

Em `vendas/page.tsx` (linha ~194):

```tsx
            <SalesInsightsPanel
              filters={{
                from,
                to,
                channel: "RETAIL",
                type,
                paymentStatus: payment,
                delivered,
                search: debouncedSearch || undefined,
              }}
            />
```

- [ ] **Step 4: Verificar tipos e build**

Run: `pnpm --filter @sistema-flores/web exec tsc --noEmit`
Expected: sem erros. (Cobertura funcional via Playwright na Task 6.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api/events.ts apps/web/src/components/events/sales-insights-panel.tsx "apps/web/src/app/(dashboard)/atacado/page.tsx" "apps/web/src/app/(dashboard)/vendas/page.tsx"
git commit -m "feat(web): insights com filtros da tela e seção Falta entregar"
```

---

### Task 5: Web — filtros persistidos na URL + navegação sem reload + voltar

**Files:**
- Create: `apps/web/src/lib/use-filter-params.ts`
- Modify: `apps/web/src/app/(dashboard)/atacado/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/vendas/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/vendas/[id]/page.tsx:113-118` (voltar)

**Interfaces:**
- Consumes: nada novo do backend.
- Produces: hook `useFilterParams(defaults: Record<string, string>): { get(key: string): string; set(patch: Record<string, string | undefined>): void }`. Params: `busca`, `pagamento`, `entrega`, `de`, `ate`, `pagina`, `insights` e (só /vendas) `tipo`.

- [ ] **Step 1: Criar o hook**

`apps/web/src/lib/use-filter-params.ts`:

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Filtros de listagem persistidos na URL (query params): sobrevivem ao
 * ir-e-voltar do detalhe e viram link compartilhável. Param ausente cai no
 * default; param presente (mesmo vazio, ex.: "Todo período") prevalece.
 * Escrita via router.replace — sem reload e sem poluir o histórico.
 */
export function useFilterParams(defaults: Record<string, string>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? defaults[key] ?? "",
    [searchParams, defaults],
  );

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  return { get, set };
}
```

- [ ] **Step 2: Reescrever o estado de `/atacado` sobre a URL**

Em `atacado/page.tsx`, substituir o bloco de estado (linhas ~49-90) por:

```tsx
export default function AtacadoPage() {
  const router = useRouter();
  const defaults = useMemo(() => {
    const range = currentMonthRange();
    return { de: range.from, ate: range.to };
  }, []);
  const { get, set } = useFilterParams(defaults);

  const paymentParam = get("pagamento");
  const payment: PaymentStatusFilter | undefined =
    paymentParam === "paid" || paymentParam === "pending"
      ? paymentParam
      : undefined;
  const deliveredParam = get("entrega");
  const delivered =
    deliveredParam === "sim" ? true : deliveredParam === "nao" ? false : undefined;
  const from = get("de");
  const to = get("ate");
  const page = Math.max(1, Number.parseInt(get("pagina"), 10) || 1);
  const showInsights = get("insights") === "1";

  // Busca digitada fica local (input fluido); a URL recebe o valor debounced.
  const [search, setSearch] = useState(() => get("busca"));
  const debouncedSearch = useDebounce(search);
  useEffect(() => {
    if (debouncedSearch === get("busca")) return;
    set({ busca: debouncedSearch || undefined, pagina: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só quando o debounce muda
  }, [debouncedSearch]);

  const sortState = useTableSort(() => set({ pagina: undefined }));

  const { data, isLoading } = useEvents({
    channel: "WHOLESALE",
    paymentStatus: payment,
    delivered,
    search: debouncedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
    sort: sortState.sort,
    order: sortState.order,
    page,
    pageSize: 20,
  });
  const { openWholesaleSale } = useQuickSale();

  const changePayment = (value: PaymentStatusFilter | undefined) =>
    set({ pagamento: value, pagina: undefined });
  const changeDelivered = (value: boolean | undefined) =>
    set({
      entrega: value === undefined ? undefined : value ? "sim" : "nao",
      pagina: undefined,
    });
  const changeDate = (nextFrom: string, nextTo: string) =>
    set({ de: nextFrom, ate: nextTo, pagina: undefined });
  const setPage = (p: number) =>
    set({ pagina: p === 1 ? undefined : String(p) });
  const toggleInsights = () =>
    set({ insights: showInsights ? undefined : "1" });
```

Ajustes decorrentes no JSX/handlers da página:
- `onSearchChange={setSearch}` no `SalesFilters` (o reset de página acontece no effect do debounce).
- Botão de insights: `onClick={toggleInsights}` (remover o `useState` de `showInsights`).
- Linhas da tabela: `onClick={() => router.push(`/atacado/${event.id}`)}` no lugar de `window.location.href = …`.
- `<Pagination data={data} onPageChange={setPage} />` continua igual (a função `setPage` agora grava na URL).
- Imports: adicionar `useRouter` de `next/navigation`, `useEffect`/`useMemo` de react, `useFilterParams` de `@/lib/use-filter-params`; remover o que sobrar sem uso.
- O empty-state usa `payment || delivered !== undefined || debouncedSearch` — segue funcionando com as novas derivações.

- [ ] **Step 3: Mesmo tratamento em `/vendas`**

Em `vendas/page.tsx`, aplicar exatamente o mesmo padrão do Step 2 com um param a mais:

```tsx
  const typeParam = get("tipo");
  const type: EventType | undefined =
    typeParam === "ORDER" || typeParam === "EVENT" ? typeParam : undefined;
  const changeType = (value: EventType | undefined) =>
    set({ tipo: value, pagina: undefined });
```

E `useEvents({ type, channel: "RETAIL", ... })` com as mesmas derivações de `payment`, `delivered`, `from`, `to`, `page`, busca debounced e `toggleInsights`. Linhas navegam com `router.push(`/vendas/${event.id}`)`.

- [ ] **Step 4: Voltar do detalhe preserva a lista**

Em `vendas/[id]/page.tsx`, trocar o `<Link href={backHref}>` (linhas 113-118) por:

```tsx
      <button
        type="button"
        onClick={() => {
          // Veio da lista? Voltar restaura a URL com os filtros. Deep link cai no fallback.
          if (window.history.length > 1) router.back();
          else router.push(backHref);
        }}
        className="inline-flex min-h-[44px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </button>
```

(O `router` já existe no componente; o import de `Link` continua usado pelo restante da página. A linha 337 — `router.push(backHref)` após excluir — fica como está: depois de excluir, voltar para a lista é o correto.)

- [ ] **Step 5: Verificar tipos**

Run: `pnpm --filter @sistema-flores/web exec tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/use-filter-params.ts "apps/web/src/app/(dashboard)/atacado/page.tsx" "apps/web/src/app/(dashboard)/vendas/page.tsx" "apps/web/src/app/(dashboard)/vendas/[id]/page.tsx"
git commit -m "feat(web): filtros de vendas/atacado persistidos na URL e voltar sem perder estado"
```

---

### Task 6: Web — itens na listagem do atacado (linha expansível) + Playwright

**Files:**
- Create: `apps/web/src/components/events/sale-items-inline.tsx`
- Modify: `apps/web/src/app/(dashboard)/atacado/page.tsx` (tabela desktop + cartões mobile)
- Test: `apps/web/e2e/atacado-itens-persistencia.spec.ts` (novo)

**Interfaces:**
- Consumes: `event.items` no payload da lista (Task 3); `unitLabels`; hook/params da Task 5.
- Produces: `SaleItemsInline({ items }: { items: EventItem[] })` — lista compacta reutilizável.

- [ ] **Step 1: Escrever o teste Playwright que falha**

Criar `apps/web/e2e/atacado-itens-persistencia.spec.ts` (mesmo padrão de signup/API de `atacado-filtros.spec.ts`):

```ts
import { expect, test } from "@playwright/test";
import { firebaseIdToken } from "./helpers";

const API = "http://localhost:3001/api";

test("atacado: itens expansíveis na listagem e filtros persistem ao voltar do detalhe", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `atkp_${stamp}@flores.com`;
  const password = "Segredo123!";
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/login");
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByLabel("Nome da empresa").fill("Floricultura Persistência");
  await page.getByLabel("Seu nome").fill("Bia");
  await page.getByLabel("CNPJ ou CPF").fill(String(stamp).padEnd(14, "0").slice(0, 14));
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await page.waitForURL(/\/inicio/);

  const token = await firebaseIdToken(page.request, email, password);
  const auth = { Authorization: `Bearer ${token}` };
  const cat = await (
    await page.request.post(`${API}/categories`, { headers: auth, data: { name: "Girassóis" } })
  ).json();
  const prod = await (
    await page.request.post(`${API}/products`, {
      headers: auth,
      data: { name: "Girassol Gigante", categoryId: cat.id, unit: "MACO", defaultSalePrice: 40 },
    })
  ).json();
  const customer = await (
    await page.request.post(`${API}/customers`, {
      headers: auth,
      data: { name: "Mercado das Flores" },
    })
  ).json();
  // Pendente de entrega: 7 maços.
  await page.request.post(`${API}/events/quick`, {
    headers: auth,
    data: {
      channel: "WHOLESALE",
      customerId: customer.id,
      items: [{ productId: prod.id, quantity: 7, unitSalePrice: 35 }],
    },
  });

  await page.goto("/atacado");

  // 1) Linha expansível: itens visíveis sem abrir o detalhe.
  await page.getByRole("button", { name: "Ver itens" }).first().click();
  await expect(page.getByText("Girassol Gigante")).toBeVisible();
  await expect(page.getByText("7 Maço")).toBeVisible();

  // 2) Insights com "Falta entregar" respeitando o período atual.
  await page.getByRole("button", { name: "Insights do período" }).click();
  await expect(page.getByText("Falta entregar")).toBeVisible();
  await expect(page.getByText("Mercado das Flores")).toBeVisible();

  // 3) Filtro aplicado vai para a URL…
  await page.getByRole("button", { name: "A entregar" }).click();
  await expect(page).toHaveURL(/entrega=nao/);

  // …e sobrevive ao ir-e-voltar do detalhe.
  await page.getByRole("link", { name: "Ver detalhes" }).first().click();
  await page.waitForURL(/\/atacado\/[0-9a-f-]+/);
  await page.getByRole("button", { name: "Atacado" }).click();
  await expect(page).toHaveURL(/entrega=nao/);
  await expect(page.getByRole("button", { name: "Insights do período" })).toBeVisible();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm --filter @sistema-flores/web exec playwright test atacado-itens-persistencia`
Expected: FAIL — não existe botão "Ver itens" (e, antes das Tasks 4-5, nem "Falta entregar"/persistência).

- [ ] **Step 3: Criar `SaleItemsInline`**

`apps/web/src/components/events/sale-items-inline.tsx`:

```tsx
import type { EventItem } from "@sistema-flores/types";
import { unitLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";

/** Itens de uma venda em lista compacta, para expandir direto na listagem. */
export function SaleItemsInline({ items }: { items: EventItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-1 text-sm text-muted-foreground">
        Venda de valor livre — sem itens detalhados.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="min-w-0 truncate">{item.description}</span>
          <span className="flex shrink-0 items-center gap-4">
            <span className="tabular-nums text-muted-foreground">
              {item.quantity} {unitLabels[item.unit] ?? item.unit}
            </span>
            <span className="w-24 text-right tabular-nums">
              {formatCurrency(item.lineTotal)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Tabela desktop com linha expansível**

Em `atacado/page.tsx`:

1. Estado + import (`Fragment` de react, `ChevronRight` de lucide, `SaleItemsInline`):

```tsx
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
```

2. No `TableHeader`, primeira coluna nova: `<TableHead className="w-10" />` (antes de "Venda").
3. No `TableBody`, envolver cada linha num `Fragment` e adicionar a célula do chevron + a linha expandida:

```tsx
                {data.data.map((event) => (
                  <Fragment key={event.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => router.push(`/atacado/${event.id}`)}
                    >
                      <TableCell
                        className="w-10 pr-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.items.length > 0 ? (
                          <button
                            type="button"
                            aria-label="Ver itens"
                            aria-expanded={Boolean(expanded[event.id])}
                            onClick={() => toggleExpanded(event.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                expanded[event.id] && "rotate-90",
                              )}
                            />
                          </button>
                        ) : null}
                      </TableCell>
                      {/* …demais células iguais às atuais… */}
                    </TableRow>
                    {expanded[event.id] ? (
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={8} className="py-2 pl-12 pr-4">
                          <SaleItemsInline items={event.items} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                ))}
```

(As demais células da linha principal não mudam — apenas o `onClick` da linha já foi trocado por `router.push` na Task 5.)

- [ ] **Step 5: Cartões mobile com expansor**

Ainda em `atacado/page.tsx`, no bloco `sm:hidden`, trocar o map por:

```tsx
          <div className="space-y-2 sm:hidden">
            {data.data.map((event) => (
              <div key={event.id} className="space-y-1">
                <ListCard
                  href={`/atacado/${event.id}`}
                  title={event.title}
                  subtitle={/* …igual ao atual… */}
                  meta={formatCurrency(event.soldValue)}
                  metaSub={/* …igual ao atual… */}
                />
                {event.items.length > 0 ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={Boolean(expanded[event.id])}
                      onClick={() => toggleExpanded(event.id)}
                      className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors active:bg-muted/60"
                    >
                      {expanded[event.id]
                        ? "Ocultar itens"
                        : `Ver itens (${event.items.length})`}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expanded[event.id] && "rotate-180",
                        )}
                      />
                    </button>
                    {expanded[event.id] ? (
                      <div className="rounded-xl border border-border bg-card px-4 py-1.5">
                        <SaleItemsInline items={event.items} />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
```

Obs.: o botão mobile "Ver itens (N)" e o do desktop têm o mesmo nome acessível ("Ver itens…"), o Playwright usa `.first()`.

- [ ] **Step 6: Rodar o Playwright e ver passar**

Run: `pnpm --filter @sistema-flores/web exec playwright test atacado-itens-persistencia`
Expected: PASS. Rodar também a suíte vizinha para regressão: `pnpm --filter @sistema-flores/web exec playwright test atacado-filtros`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/events/sale-items-inline.tsx "apps/web/src/app/(dashboard)/atacado/page.tsx" apps/web/e2e/atacado-itens-persistencia.spec.ts
git commit -m "feat(web): itens da venda expansíveis na listagem do atacado"
```

---

### Task 7: Verificação final

**Files:** nenhum novo — validação.

- [ ] **Step 1: Suítes completas**

```bash
pnpm --filter @sistema-flores/types test
pnpm --filter @sistema-flores/api test:e2e -- --testPathPattern "sales-insights|events\.e2e"
pnpm --filter @sistema-flores/web exec tsc --noEmit
pnpm --filter @sistema-flores/web exec playwright test atacado
```

Expected: tudo PASS.

- [ ] **Step 2: Lint/format do repo (se configurado no turbo)**

Run: `pnpm turbo lint --filter=@sistema-flores/web --filter=@sistema-flores/api --filter=@sistema-flores/types` (ou o script equivalente do repo; se não existir, pular).

- [ ] **Step 3: Commit final (se houver ajustes)**

```bash
git add -A && git commit -m "chore: ajustes finais de insights/entregas/persistência"
```
