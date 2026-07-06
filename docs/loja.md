# Loja online do Floreei

E-commerce por floricultura, integrado ao ERP. O cliente final compra
buquês/cestas/kits, paga online (Mercado Pago — Pix/cartão) e a venda cai
**automaticamente no ERP**: baixa de estoque + faturamento. Cada loja é
personalizada (logo, nome, paleta) e acessível por **subdomínio próprio**
(`{slug}.floreei.com.br`).

## Arquitetura

- **`apps/loja`** (Next 15, SSR): a vitrine. Lê o subdomínio → resolve o slug →
  busca branding + catálogo na API pública → aplica a paleta da empresa por CSS
  variables. Carrinho + checkout no cliente.
- **API `modules/storefront`** (`@Public`, escopado por slug): `GET /store/:slug`
  (branding), `/catalog`, `/items/:id`, `POST /checkout`, `POST
  /webhooks/mercadopago`. E `GET /store-orders` (autenticado, para o ERP).
- **Pagamento por tenant**: cada floricultura usa a **própria conta Mercado
  Pago** — o dinheiro cai na conta dela. O access token é guardado
  **criptografado** (AES-256-GCM, chave `STORE_SECRETS_KEY`) e nunca vai ao
  browser.
- **Pedido → venda**: o checkout cria um `store_order` (PENDING) + uma
  preferência de pagamento. Ao aprovar, o **webhook** confirma o pagamento
  consultando o Mercado Pago (autoritativo), e cria a venda reusando
  `events.quickSale` → baixa + faturamento. Idempotente (não cria 2×).

## Configurar uma loja (no ERP → "Loja online")

1. **Endereço**: defina o slug (ex.: `flores-da-ana`) → a loja fica em
   `flores-da-ana.floreei.com.br`.
2. **Aparência**: cor principal + cor de destaque (preview ao vivo), frase de
   destaque e descrição. O logo vem de "Empresa".
3. **Pagamento (Mercado Pago)**: cole a **Public key** e o **Access token** da
   sua conta (painel do Mercado Pago → Suas integrações → Credenciais). Use
   credenciais de **teste** para validar antes de ir ao ar.
4. **Ative a loja** (só depois de definir o slug).
5. **Publique buquês**: em "Buquês", edite cada um → envie a **foto** e marque
   **"Publicar na loja"**. Eles aparecem agrupados pela **categoria** do buquê
   (crie categorias "Buquês", "Cestas", "Kits" no catálogo).

## Rodar local

- API + web: `pnpm dev:all` (a loja sobe na porta **3300**).
- **Slug em dev**: como `localhost` não tem subdomínio, defina
  `NEXT_PUBLIC_STORE_DEV_SLUG=<seu-slug>` no `apps/loja/.env.local`.
- **Webhook em dev**: o Mercado Pago precisa alcançar a API pela internet. Suba
  um túnel (`cloudflared tunnel --url http://localhost:3001` ou `ngrok http
  3001`) e aponte `STORE_PUBLIC_API_URL` para a URL do túnel (`.../api`).

## Deploy

- **`apps/loja` → Vercel** (SSR): novo projeto, Root Directory `apps/loja`,
  Ignored Build Step `npx turbo-ignore`. Adicione o **domínio wildcard**
  `*.floreei.com.br` ao projeto (a Vercel emite SSL wildcard).
- **DNS**: um registro `*` (wildcard) apontando para a Vercel (CNAME
  `cname.vercel-dns.com`).
- **API**: garanta `STORE_SECRETS_KEY`, `STORE_PUBLIC_API_URL`
  (= URL pública da API, p/ o webhook) e `STORE_BASE_DOMAIN` no ambiente.
- **CORS**: inclua o domínio das lojas nas origens (o checkout chama a API do
  browser). Como o subdomínio é dinâmico, libere `*.floreei.com.br`.
- **Mercado Pago**: troque as credenciais de teste pelas de **produção** em cada
  loja quando for pra valer.

## Matriz de env (loja)

- **`apps/loja` (Vercel)**: `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_STORE_BASE_DOMAIN`.
- **API**: `STORE_SECRETS_KEY`, `STORE_PUBLIC_API_URL`, `STORE_BASE_DOMAIN`.

## Teste ponta a ponta

1. Configure slug + cores + **token de teste** do Mercado Pago numa empresa.
2. Publique 1 buquê com foto.
3. Abra a loja (dev slug ou subdomínio) → monte o carrinho → checkout.
4. Pague com **Pix de teste** do Mercado Pago.
5. Confira: o webhook criou a **venda** no ERP (baixa de estoque + faturamento) e
   o pedido em "Pedidos da loja" ficou **Pago** com link para a venda.

## Segurança

- Token do Mercado Pago: cifrado em repouso; só a public key vai ao browser.
- Webhook: confirma o pagamento consultando o Mercado Pago (não confia no
  payload) e é **idempotente**.
- Endpoints públicos: tenant resolvido no servidor por slug; **preços sempre
  recalculados no servidor** (nunca confia no carrinho do cliente).
