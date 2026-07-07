# Assinatura de planos — tiers + Mercado Pago

## Context

O Floreei precisa vender por assinatura. Já existe a base de entitlements: 3 tiers
(`ESSENCIAL` R$79, `LOJA` R$149, `COMPLETO` R$229) em `packages/types/src/entitlements.ts`,
`FeatureGuard` na API, colunas `tier`/`feature_overrides` em `companies` e o console do
gestor (`apps/admin`) com trial de 7 dias, extensão, ativação manual e suspensão.
Falta o fluxo de assinatura em si: cobrança recorrente, telas de plano no ERP e o
controle de plano/features no backoffice.

Decisões (2026-07-06):
1. **Preço** = base do plano + **R$16 × cada usuário ativo** — nenhum usuário incluso
   na base e **sem limite** de usuários (a assinatura não trava a quantidade).
2. **Pagamento**: assinatura recorrente **Mercado Pago** (preapproval), self-service;
   valor recalculado quando muda o nº de usuários (vale no próximo ciclo).
3. **Backoffice**: gestor atribui plano e liga/desliga features por empresa (overrides).
4. **Tiers**: mantidos como estão (features e preços-base atuais).
5. **Inadimplência**: carência de **5 dias** com banner ("pagamento pendente");
   depois, tela de bloqueio com CTA de reassinar. Gestor pode liberar manualmente
   (`activate` já existe no console).

Trial de 7 dias segue igual (todas as features liberadas).

## Modelo de preço

- `planPrice(def, activeUsers) = basePrice + activeUsers × userPrice` (padrão R$16).
- Sem `includedSeats`/cap de assentos: criar usuário nunca é bloqueado por plano;
  apenas muda o valor da assinatura.

## Planos parametrizáveis (decisão de 2026-07-06, mesma data)

Nada de plano é fixo no código: nome, descrição, **preço-base, preço por usuário e
features** de cada tier moram na tabela `plan_definitions` (semeada pela migração com
os valores acima) e são editados pelo console do gestor em **Planos** (`/planos`,
gravação restrita a OWNER via `PUT /admin/plans/:tier`). A API lê via
`PlanDefinitionsService` (cache em memória de 30s; o update invalida na hora).
Os códigos dos 3 tiers (`ESSENCIAL | LOJA | COMPLETO`) permanecem fixos — o que é
editável é o conteúdo de cada um. Mudança de preço **reaplica o valor nas
assinaturas em vigor** do tier (`resyncTierAmounts`): o novo valor entra na próxima
cobrança de cada assinante.

## Assinatura Mercado Pago (API)

- Env `MP_PLATFORM_ACCESS_TOKEN` (conta da plataforma; separada dos tokens por-empresa
  da loja online). Client REST de preapproval injetável (create/get/update amount/cancel).
- Tabela `subscriptions`: `company_id`, `tier`, `mp_preapproval_id` (unique), `status`
  (`PENDING | AUTHORIZED | PAUSED | CANCELLED`), `amount`, `billed_users`,
  `payment_failed_at`, timestamps. Uma linha por preapproval (histórico); a vigente é a
  mais recente não-cancelada.
- Módulo `billing` (rotas do tenant): `GET /billing/plans`, `GET /billing/subscription`,
  `POST /billing/subscribe { tier }` → `initPoint`, `POST /billing/change-plan { tier }`,
  `POST /billing/cancel`, webhook público `POST /billing/webhooks/mercadopago` com
  consulta autoritativa ao MP (padrão do storefront).
- Acesso efetivo (precedência): `SUSPENDED` > `plan=ACTIVE` (cortesia manual) >
  assinatura `AUTHORIZED` (carência `PAYMENT_GRACE_DAYS = 5` após `payment_failed_at`)
  > `TRIAL` > bloqueado (`TRIAL_EXPIRED` / novo código `PAYMENT_OVERDUE`).
- Sync de valor: criar/ativar/desativar usuário recalcula o amount e atualiza o
  preapproval; falha do MP não bloqueia a operação (log; próximo sync corrige).

## ERP (`apps/web`)

- Página **Plano** (`(dashboard)/plano`, adminOnly): plano atual + status da assinatura,
  breakdown (base + N × R$16), comparativo dos 3 planos, assinar / trocar / cancelar.
- `access-blocked.tsx`: `TRIAL_EXPIRED` e `PAYMENT_OVERDUE` mostram os planos com botão
  de assinar; WhatsApp vira fallback. Banner de pagamento pendente na carência.
- Navegação: `NavItem.feature` + gating por `features` do `/auth/me`; módulo fora do
  plano mostra upsell com CTA para `/plano`.

## Backoffice (`apps/admin`)

- `PUT /admin/companies/:id/entitlements { tier?, featureOverrides? }`; `detail` passa a
  incluir tier, overrides e assinatura. Card "Plano & acesso" no detalhe da empresa:
  select de tier + toggles de feature em 3 estados (herdado / on / off).

## Verificação

e2e de entitlements (sem cap) e de billing (MP mockado: subscribe → webhook autoriza →
libera; pagamento rejeitado → carência → `PAYMENT_OVERDUE`; usuários mudam o amount;
endpoint do console reflete no `/auth/me`). `pnpm typecheck && lint && build` + migrações.

## Funil de venda (adição de 2026-07-06)

Quatro reforços de conversão, aprovados após revisão de negócio:

- **Landing com planos vigentes** — a seção de preços busca `GET /billing/public-plans`
  (endpoint público) com fallback para `PLAN_TIER_LIST`; calculadora por nº de pessoas;
  CTA primário "Testar grátis por 7 dias" → `NEXT_PUBLIC_APP_URL`; WhatsApp secundário.
- **Trial que vende** — checklist "Primeiros passos" no Início durante o trial
  (`GET /dashboard/first-steps`); a tela de fim de trial mostra o uso da empresa
  (`GET /billing/trial-summary`, acessível bloqueada) e destaca o plano recomendado
  (heurística: usou loja → STORE; usou compras/despesas/buquês → estoque+financeiro;
  ambos → COMPLETO, um → LOJA, nenhum → ESSENCIAL).
- **Cockpit de vendas no console** — `PlatformOverview.sales`: MRR (Σ das AUTHORIZED),
  assinantes por plano e listas acionáveis (trials vencendo em ≤3 dias, checkouts
  PENDING de 1h–14d, pagamentos pendentes), cada empresa com botão de WhatsApp
  pré-preenchido (o canal do público; e-mail transacional ficou fora por decisão).
- **Retomar checkout** — `subscriptions.mp_init_point` persiste o link do MP; assinatura
  PENDING mostra "Continuar pagamento" na página de plano e na tela de bloqueio.

### Fundador e posicionamento (2026-07-07)

- **Vagas de fundador (10)** — `companies.founder` (permanente): consumida
  automaticamente na 1ª assinatura AUTHORIZED (enquanto houver vaga) ou marcada
  manualmente pelo gestor no console (fechamentos por WhatsApp; cancelar não devolve).
- **Endpoint público ÚNICO** — `GET /billing/public-landing` (o webhook é o outro
  @Public, sem leitura): devolve somente planos vigentes + contagem de vagas
  ({total, taken, remaining}), com `Cache-Control: max-age=60` e sob o throttle
  global. Nenhum dado de empresa/usuário. A landing usa esse endpoint nas seções
  de planos e de oferta de fundador (contador ao vivo, com estado de esgotado).
- **ERP fala "upgrade", landing fala "assinar"** — dentro do produto o CTA é
  "Fazer upgrade" (banner do trial, página Plano, bloqueio; inadimplente vê
  "Reativar plano"); a venda/assinatura é linguagem da landing.

## Fora de escopo (v1)

Pró-rata, nota fiscal, notificações de cobrança próprias (canal = WhatsApp manual
guiado pelo console), plano anual com desconto, cupons, programa de indicação.
