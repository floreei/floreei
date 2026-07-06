# Console do gestor da plataforma (super-admin / operador do SaaS)

## Context
O Sistema Flores é um SaaS multi-tenant (empresas = `companies`, isolamento por `company_id`,
auth Firebase). Falta um **console do operador** para: controlar o **acesso** das empresas
(plano gratuito de 7 dias a partir do primeiro acesso, com opção de **estender**; suspender/reativar),
acompanhar **uso** (quem está usando ou não, para reativar/ajudar) e ver **métricas ricas** por
empresa. É um app **separado** (`apps/admin`) consumindo a **API existente** (`apps/api`) via rotas
`/admin/*` protegidas, no mesmo Postgres. Decisões do usuário: equipe de gestores (tabela), plano
gratuito de 7 dias + extensão, front separado + API atual.

## Arquitetura
- **`apps/admin`** — novo front Next.js (deploy próprio), login só para gestores da plataforma.
- **`apps/api`** — novo módulo `platform` com rotas `/admin/*` (guard de gestor), consultas
  **cross-tenant** (agregadas por `company_id`, fora do filtro multi-tenant normal).
- **`packages/types`** — novos schemas/DTOs (`platform.ts`).
- Mesmo Postgres, mesmo Firebase.

## Modelo de dados
`CompanyEntity` ganha (migração):
- `first_access_at` (timestamptz, null) — 1º acesso; dispara o trial.
- `trial_ends_at` (timestamptz, null) — `first_access_at + 7d`; é o que se estende.
- `plan` (varchar) — `TRIAL` | `ACTIVE` (liberada sem prazo). Default `TRIAL`.
- `suspended` (bool, default false) — bloqueio manual.
- `last_seen_at` (timestamptz, null) — atualizado (throttle ~1h) a cada acesso autenticado.
- **Backfill**: empresas existentes → `plan=ACTIVE` (não bloquear ninguém já ativo).

Nova tabela **`platform_admins`**: `id`, `email` (unique), `firebase_uid` (null), `name`,
`role` (`OWNER` | `SUPPORT`), `active` (bool), timestamps.

**Status efetivo (calculado, não coluna):** `SUSPENDED` (suspended) › `ACTIVE` (plan ACTIVE) ›
`TRIAL` (now ≤ trial_ends_at) › `EXPIRED`. Acesso do cliente liberado só em ACTIVE/TRIAL.

## Controle de acesso (trial)
- **Guard do cliente** (`apps/api` `FirebaseAuthGuard`/resolução de `AuthUser`): ao autenticar,
  - seta `first_access_at`/`trial_ends_at` no 1º acesso (se null);
  - atualiza `last_seen_at` (throttle);
  - se status efetivo = EXPIRED ou SUSPENDED → **403** com código (`COMPANY_SUSPENDED` /
    `TRIAL_EXPIRED`). O `apps/web` mostra tela "período gratuito acabou — fale com a gente".
- Ações do console: **estender trial** (`trial_ends_at = max(now, trial_ends_at) + N dias`, mantém
  TRIAL), **liberar** (`plan=ACTIVE`), **suspender** (`suspended=true`), **reativar**
  (`suspended=false`).

## Auth do console (gestores)
- `PlatformAdminGuard`: verifica o ID token Firebase (`verifyIdToken`, só projectId, como o resto) →
  acha em `platform_admins` por `firebase_uid`/email, ativo → injeta `PlatformAdmin { id, email, role }`.
  Senão 403.
- **Bootstrap**: env `PLATFORM_OWNER_EMAILS` (csv) — esses e-mails são sempre OWNER (mesmo sem linha),
  para o 1º login. `OWNER` gerencia gestores; `SUPPORT` vê e age (trial/acesso) mas não mexe em gestores.

## Métricas (serviço de agregação cross-tenant)
Por empresa: status/plano + dias de trial restantes; **uso** (`last_seen_at`, dias inativa, ativa em
7/30d, nº usuários ativos, risco = inativa há N dias); **volume** (nº clientes/produtos/buquês/vendas,
**receita** Σ `events.sold_value`, orçamentos, compras Σ `purchases.total`, despesas); **tendência**
(vendas 7d atuais × 7d anteriores); idade da conta.
Visão geral: total de empresas por status, novos cadastros (7/30d), empresas em risco (inativas),
receita total processada. Consultas agregadas por `company_id` (GROUP BY), sem o filtro de tenant.

## Endpoints (`/admin/*`, guard de gestor)
`GET /admin/overview`; `GET /admin/companies` (lista + métricas + filtros status/risco/busca);
`GET /admin/companies/:id` (detalhe + métricas + usuários + atividade); `POST
/admin/companies/:id/extend-trial` `{ days }`; `POST .../activate`; `POST .../suspend`; `POST
.../reactivate`; `GET /admin/admins`; `POST /admin/admins` (OWNER); `DELETE /admin/admins/:id` (OWNER).

## Telas (`apps/admin`)
1. Login (só gestores). 2. Visão geral (KPIs + em risco + novos). 3. Empresas (lista com status,
dias de trial, último acesso, nº usuários, receita; filtros + busca; ações rápidas). 4. Empresa
(detalhe: perfil + status/trial + métricas + usuários + timeline + ações). 5. Gestores (CRUD, OWNER).
Reusa o design system (tokens, primitivas) do `apps/web` onde fizer sentido.

## Verificação
- **e2e** (`apps/api`): guard de gestor (nega não-admin); overview/lista/detalhe com métricas;
  extend/suspend/reactivate mudam o status; **o guard do cliente bloqueia empresa EXPIRED/SUSPENDED**
  (401/403) e libera após estender/reativar; admins CRUD (OWNER vs SUPPORT).
- **Playwright** (`apps/admin`): logar como gestor, ver empresas, estender trial, suspender.
- `pnpm typecheck && lint && build`; migração no banco de dev.

## Fases (ordem de implementação)
1. Modelo + migração (company plano/trial/lastSeen + platform_admins) + types.
2. Enforcement do trial no guard do cliente + tela de bloqueio no `apps/web`.
3. Auth de gestor (`PlatformAdminGuard` + bootstrap) + admins CRUD.
4. Serviço de métricas + endpoints `/admin/*` + e2e.
5. Front `apps/admin` (scaffold + telas) + Playwright.

## Fora de escopo (v1)
Billing/pagamento (só trial gratuito + extensão manual). Impersonar "entrar como". Notificações
automáticas de reativação (só dá pra ver quem está em risco).
