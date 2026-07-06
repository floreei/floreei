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

- `planPrice(tier, activeUsers) = basePrice + activeUsers × USER_PRICE` (`USER_PRICE = 16`).
- Sem `includedSeats`/cap de assentos: criar usuário nunca é bloqueado por plano;
  apenas muda o valor da assinatura.

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

## Fora de escopo (v1)

Pró-rata, nota fiscal, preços na landing, notificações de cobrança próprias.
