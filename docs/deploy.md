# Deploy do Floreei

Monorepo, deploy independente por app (multi-cloud). Visão geral:

| App | Onde | Como |
|---|---|---|
| `apps/landing` (estática) | **Cloudflare Pages** | `output: "export"` → serve `out/`; auto-deploy (git nativo) |
| `apps/web` (ERP) | **Vercel** | Root Directory `apps/web`; auto-deploy (git nativo) |
| `apps/admin` (console) | **Vercel** | Root Directory `apps/admin`; auto-deploy (git nativo) |
| `apps/loja` (storefront padrão) | **Vercel** | Root Directory `apps/loja`; domínio **wildcard** `*.floreei.com.br` (resolve a loja por slug) |
| `apps/floravie` (loja c/ design próprio) | **Vercel** | Root Directory `apps/floravie`; subdomínio **específico** `floravie.floreei.com.br` (vence o wildcard) — ver §9 |
| `apps/api` (NestJS) | **AWS App Runner** | imagem Docker no ECR; deploy via GitHub Actions (OIDC) |
| Postgres | **Neon** (serverless) | endpoint público TLS; migrar p/ RDS/Aurora depois |
| Auth + Storage | **Firebase** (Google) | inalterado; a API só fala HTTPS |
| Segredos | **AWS Secrets Manager** / GitHub Secrets | creds do banco, ARN da role OIDC |

Domínios sugeridos: `floreei.com.br` (landing), `app.floreei.com.br` (web),
`admin.floreei.com.br` (admin), `api.floreei.com.br` (API).

---

## 1. Banco — Neon (começar barato, migrar depois)
- Crie um projeto no **Neon** → um banco Postgres. Use a **connection string pooled**.
- Anote host, porta (5432), user, password, dbname. **Neon exige TLS** → na API, `DATABASE_SSL=true`.
- É Postgres padrão: **migrar depois** para RDS/Aurora = `pg_dump | pg_restore` (ou replicação
  lógica) + trocar as `DATABASE_*`. Zero mudança no app.
- Como o endpoint é **público com TLS**, o App Runner conecta direto pela internet — **não precisa de
  VPC connector** nesta fase (menos setup). Ao migrar para RDS privado, aí sim adicione o VPC connector.

## 2. AWS — API (App Runner + ECR)
### 2.1 ECR
```bash
aws ecr create-repository --repository-name floreei-api
```
### 2.2 OIDC (GitHub → AWS, sem chave de longa duração)
1. **IAM → Identity providers → Add provider**: OpenID Connect, URL
   `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Crie uma **IAM Role** com *trust policy* limitada ao seu repo/branch:
   ```json
   {
     "Effect": "Allow",
     "Principal": { "Federated": "arn:aws:iam::<ACCOUNT>:oidc-provider/token.actions.githubusercontent.com" },
     "Action": "sts:AssumeRoleWithWebIdentity",
     "Condition": {
       "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
       "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<owner>/<repo>:ref:refs/heads/main" }
     }
   }
   ```
   Permissões da role: push no ECR (`ecr:*` no repositório) e, se for disparar deploy,
   `apprunner:StartDeployment`.
3. No GitHub → **Settings → Secrets and variables → Actions**:
   - Secret **`AWS_DEPLOY_ROLE_ARN`** = ARN da role acima.
   - (Opcional) Variable **`APPRUNNER_SERVICE_ARN`** = ARN do serviço App Runner (para disparar o
     deploy explicitamente; se o App Runner estiver com auto-deploy no push da imagem, não precisa).
   - Variable **`DEPLOY_API_ENABLED=true`** — **ligue só depois** de ter ECR + OIDC + App Runner
     prontos. Enquanto estiver ausente, o workflow `deploy-api.yml` fica **inerte** (job skipped),
     sem falhar.
   - Ajuste `AWS_REGION` no `.github/workflows/deploy-api.yml` (default `us-east-1`).

### 2.3 App Runner
- Serviço **a partir do ECR** (`floreei-api:latest`); **auto-deploy** no push da imagem (recomendado).
- **Porta** `8080`; **health check** HTTP `/api/health`.
- **Env/segredos** (texto ou Secrets Manager): ver matriz na seção 5 (com `DATABASE_SSL=true`).
- **Custom domain** `api.floreei.com.br`.

### 2.4 Migrações
O container roda `migration:run` (data-source compilado) no start e então sobe a API — idempotente.

---

## 3. CD (deploy automático no push da `main`)
- **Fronts (nativo, sem GitHub Actions):**
  - **Vercel** (web/admin): 2 projetos importando o repo, Root Directory `apps/web` / `apps/admin`,
    Ignored Build Step `npx turbo-ignore`, envs `NEXT_PUBLIC_*`. Auto-deploy no push + preview por PR.
  - **Cloudflare Pages** (landing): projeto no repo, build `pnpm install && pnpm --filter
    @sistema-flores/landing build`, output `apps/landing/out`, envs `NEXT_PUBLIC_WHATSAPP_LINK` e
    `NEXT_PUBLIC_CONTACT_EMAIL`. Auto-deploy no push.
- **API (GitHub Actions):** `.github/workflows/deploy-api.yml` — no push para `main` que toca
  `apps/api/**`/`packages/types/**`, autentica na AWS via **OIDC**, builda a imagem, faz push no ECR
  (App Runner auto-deploya). O `docker build` compila tudo — se não compilar, não publica.
- **CI** (`.github/workflows/ci.yml`) roda em paralelo (typecheck/lint/test/e2e), com os `FIREBASE_*`
  públicos no `env`.

---

## 4. DNS + Firebase
- Aponte cada domínio para o alvo (Cloudflare / Vercel / App Runner) conforme cada painel indicar.
- **Firebase Console → Authentication → Settings → Authorized domains**: adicione
  `app.floreei.com.br`, `admin.floreei.com.br` (e o domínio da landing).

### 4.1 Service account (Admin SDK) — necessária para apagar usuários
Sem a service account, a API só verifica tokens e cria/loga via REST; operações
privilegiadas como **apagar um usuário do Firebase** (ao excluir a empresa pelo
console) viram no-op — o banco é limpo, mas o login continua no Firebase.

1. **Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova
   chave privada** → baixa um `service-account.json`. **É segredo — nunca comitar.**
2. No App Runner, em vez de montar arquivo, passe o JSON por env (base64):
   ```bash
   base64 -i service-account.json | tr -d '\n'   # cole o resultado no secret
   ```
   Setar `FIREBASE_SERVICE_ACCOUNT_B64=<base64>` (guardar no AWS Secrets Manager).
   Localmente dá para usar o arquivo: `GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json`.
3. A API detecta a credencial sozinha e habilita o Admin SDK — a exclusão passa a
   remover os logins do Firebase também.

---

## 5. Matriz de variáveis de ambiente
**API (App Runner):**
```
NODE_ENV=production
PORT=8080
DATABASE_HOST=<neon-host>        # ex.: ep-xxx-pooler.<region>.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=<user>
DATABASE_PASSWORD=<secret>
DATABASE_NAME=<db>
DATABASE_SSL=true                 # Neon exige TLS
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_API_KEY=<apiKey pública>
# Admin SDK (apagar usuário ao excluir empresa). Sem isso, exclui só do banco.
FIREBASE_SERVICE_ACCOUNT_B64=<base64 do service-account.json>   # ver 4.1
PLATFORM_OWNER_EMAILS=voce@floreei.com
CORS_ORIGINS=https://app.floreei.com.br,https://admin.floreei.com.br
# Libera QUALQUER subdomínio confiável (ERP, admin, Floravie e TODA loja por slug)
# sem listar uma a uma. O ponto inicial evita casar "evilfloreei.com.br".
CORS_ORIGIN_SUFFIXES=.floreei.com.br
# E-mail transacional (Resend). Sem RESEND_API_KEY, os avisos viram no-op logado.
RESEND_API_KEY=<secret>
EMAIL_FROM=Floreei <nao-responda@send.floreei.com.br>  # SUBDOMÍNIO verificado no Resend
PLATFORM_NOTIFY_EMAIL=hugouraga61@gmail.com             # destino dos avisos de cadastro
```
> **Resend — use um subdomínio (`send.floreei.com.br`), não o domínio raiz.** O raiz
> `floreei.com.br` é do e-mail profissional (Titan/HostGator: `MX titan.email` +
> `SPF include:spf.titan.email`); o Resend fica isolado no `send.` com MX/SPF/DKIM
> próprios e os dois convivem. Verifique o subdomínio no Resend (registros no DNS) e
> gere a API key. **Cuidado:** o domínio raiz aceita **apenas um** registro SPF
> (`v=spf1`) — não deixe um `v=spf1 -all` avulso junto do SPF do Titan, senão o SPF dá
> `permerror` e, com `DMARC p=reject`, seu e-mail profissional para de ser entregue.
> Sem a key, o cadastro funciona normalmente — só não sai o e-mail (fica logado).
**web / admin (Vercel):** `NEXT_PUBLIC_API_URL=https://api.floreei.com.br/api` + `NEXT_PUBLIC_FIREBASE_*`.
**landing (Cloudflare):** `NEXT_PUBLIC_WHATSAPP_LINK`, `NEXT_PUBLIC_CONTACT_EMAIL`.

---

## 6. Verificação local
```bash
# API (imagem de produção) contra o Postgres de dev — responde /api/health:
docker build -f apps/api/Dockerfile -t floreei-api:local .
docker run --rm -p 8080:8080 \
  -e NODE_ENV=production -e PORT=8080 \
  -e DATABASE_HOST=host.docker.internal -e DATABASE_PORT=5440 \
  -e DATABASE_USER=flores -e DATABASE_PASSWORD=flores -e DATABASE_NAME=sistema_flores \
  -e FIREBASE_PROJECT_ID=<project-id> -e FIREBASE_API_KEY=<apiKey> \
  floreei-api:local
curl http://localhost:8080/api/health     # -> {"status":"ok",...}

# Landing (export estático):
pnpm --filter @sistema-flores/landing build   # gera apps/landing/out/
```

## 7. Migração futura do banco (Neon → RDS/Aurora)
```bash
pg_dump "postgresql://<neon-conn>" -Fc -f floreei.dump
pg_restore -d "postgresql://<rds-conn>" --no-owner floreei.dump
# trocar as DATABASE_* no App Runner; adicionar VPC connector p/ RDS privado.
```

## 8. Loja online (storefront)
Guia dedicado em [`docs/loja.md`](./loja.md): configurar loja (slug, cores,
Mercado Pago), publicar buquês, deploy do `apps/loja` na Vercel com domínio
**wildcard `*.floreei.com.br`**, e o fluxo de teste ponta a ponta.

## 9. Floravie — loja com storefront PRÓPRIO (`apps/floravie`)
A Floravie é uma **loja do ERP com design exclusivo** (não usa o template do
`apps/loja`). Ela consome só os **dados** da API (catálogo + avaliações) atrás de
uma flag; o back não impõe cores (a empresa fica marcada `store_custom=true`).

**Enquanto não houver domínio próprio, sobe como subdomínio: `floravie.floreei.com.br`.**

### 9.1 Projeto na Vercel
- Novo projeto importando o repo, **Root Directory `apps/floravie`**, Ignored
  Build Step `npx turbo-ignore`. Auto-deploy no push (como web/admin/loja).
- **Env:**
  ```
  NEXT_PUBLIC_FLORAVIE_USE_MOCK=false        # false = consome a API (true = mock)
  NEXT_PUBLIC_API_URL=https://api.floreei.com.br/api
  NEXT_PUBLIC_FLORAVIE_STORE_SLUG=floravie
  ```

### 9.2 Domínio (subdomínio específico vence o wildcard)
- No **projeto Floravie** (Vercel), adicione o domínio **`floravie.floreei.com.br`**.
  Um domínio específico tem **precedência** sobre o wildcard `*.floreei.com.br`
  do `apps/loja` — então `floravie.` cai na Floravie e todos os outros slugs
  continuam no storefront padrão.
- **DNS:** se o wildcard `*.floreei.com.br` já aponta para a Vercel, o host
  `floravie` já resolve; basta a atribuição do domínio no projeto. Caso contrário,
  crie um **CNAME `floravie` → `cname.vercel-dns.com`**.
- Ao comprar o domínio próprio, é só adicionar o novo domínio nesse projeto e
  ajustar a env/CORS — nada mais muda.

### 9.3 API — CORS e bootstrap da loja
- Garanta `CORS_ORIGIN_SUFFIXES=.floreei.com.br` na API (libera `floravie.` e as
  demais lojas automaticamente). Ver §5.
- **Criar a empresa Floravie + vincular o admin** (`connect:floravie`, idempotente).
  Duas formas — escolha uma:
  - **Pela pipeline (recomendado, sem env na mão):** setar **`CONNECT_FLORAVIE=true`**
    no serviço da API e deployar. O `docker-entrypoint.sh` roda o script **depois
    das migrations**, no boot (não bloqueia a API se falhar). Depois de rodar uma
    vez, pode **remover a env** (é idempotente e barato de qualquer forma).
  - **Manual (da sua máquina, contra o Neon de prod):**
    `... DATABASE_* FIREBASE_* pnpm --filter @sistema-flores/api connect:floravie`.
  - ⚠️ **Pré-requisito:** vincular o admin usa `getUserByEmail` (Admin SDK) → exige a
    **service account** (`FIREBASE_SERVICE_ACCOUNT_B64`, ver §4.1). Sem ela, a
    empresa é criada mas o admin **não** é vinculado (o passo loga a falha e segue).
    O e-mail padrão é `hugouraga61@gmail.com` (sobrescreva com `FLORAVIE_ADMIN_EMAIL`).
- Publicar os buquês reais no ERP (foto, categoria buques/cestas, tamanhos).
- **Firebase Authorized domains:** NÃO precisa — a Floravie é loja pública, sem
  login do ERP.

> **Nota:** o `docs/deploy.md` cita "App Runner", mas a API hoje roda em **Cloud
> Run (us-east1)**; a estratégia de CORS/subdomínio é a mesma.
