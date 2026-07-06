# Handoff: Landing Page de Vendas — Sistema Flores

## Overview
Landing page de **captação de clientes** para o **Sistema Flores**, um ERP web para floriculturas e decoradores de eventos. A landing é um produto **separado** do sistema em si: seu único objetivo é converter visitantes em contatos comerciais via **WhatsApp**. A página apresenta os módulos do produto, mostra o sistema "funcionando", detalha funcionalidades-chave (incluindo formação de preço e emissão de nota/pedido), traz prova social, planos e FAQ.

CTA principal em toda a página: **"Falar no WhatsApp"** (link `wa.me`).

## About the Design Files
Os arquivos deste pacote são **referências de design criadas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar diretamente**.

A tarefa é **recriar estes designs no ambiente do codebase de destino** (Next.js/React, Vue, etc.), usando os padrões e bibliotecas já estabelecidos ali. Se ainda não houver um ambiente, o Sistema Flores é descrito como **Next.js 14 (App Router) + React + TypeScript + Tailwind CSS + componentes estilo shadcn/ui + lucide-react** — recomenda-se seguir essa stack para consistência com o produto principal.

O arquivo `Landing Sistema Flores.dc.html` é um **Design Component** (roda num runtime próprio de preview). Trate-o como fonte visual/comportamental de referência; a marcação usa estilos inline e um pequeno bloco `<style>` — os valores são todos rastreáveis aos tokens em `design-tokens/`.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento, sombras, raios e microinterações são finais e derivam dos tokens do design system Sistema Flores. Recreie a UI com fidelidade de pixel usando os componentes/bibliotecas do codebase. Todos os valores de cor estão em **HSL** no padrão shadcn/Tailwind (`hsl(var(--token))`).

## Design System — Fonte da Verdade
Os tokens completos estão em `design-tokens/` (copiados do design system): `colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `fonts.css`, `base.css`. **Use esses tokens diretamente** — no produto principal eles já existem em `apps/web/src/app/globals.css` mapeados no `tailwind.config.ts`. A landing deve reusar os mesmos tokens.

### Fontes
- **Fraunces** (serifa variável, eixos `opsz` + `SOFT`) — títulos de página/display e números grandes. Classe de apoio no protótipo: `.sf-serif` (aplica `font-family: var(--font-serif)` + `font-variation-settings: 'opsz' 40, 'SOFT' 40` + `letter-spacing: -0.02em`).
- **Inter** — corpo, títulos de seção (semibold), labels, botões.
- Números sempre com `font-variant-numeric: tabular-nums`.

### Cores (light mode — HSL cru, usar como `hsl(var(--token))`)
| Token | Valor | Uso |
|---|---|---|
| `--background` | `140 16% 98%` | fundo papel sage |
| `--foreground` | `165 16% 15%` | tinta pinho quase-preto |
| `--card` | `0 0% 100%` | superfície branca de cards |
| `--primary` | `160 34% 28%` | verde pinho — marca, painéis escuros, CTAs primários |
| `--primary-foreground` | `140 30% 98%` | texto sobre primary |
| `--secondary` | `146 20% 93%` | fundos suaves, faixas de seção |
| `--muted-foreground` | `158 8% 40%` | texto secundário |
| `--accent` | `22 44% 92%` | argila clara (halos/gradientes sutis) |
| `--clay` | `16 54% 55%` | argila saturada — CTA de destaque (WhatsApp), ênfase, dados |
| `--clay-foreground` | `0 0% 100%` | texto sobre clay |
| `--success` | `152 40% 34%` | status aprovado/pago, checks |
| `--warning` | `32 72% 48%` | status pendente/acabando |
| `--destructive` | `4 62% 52%` | erros, a pagar |
| `--border` | `146 14% 90%` | bordas finas |
| `--input` | `146 14% 86%` | bordas de input |
| `--chart-3` | `192 42% 38%` | azul-petróleo (ícone estoque) |
| `--chart-5` | `268 32% 60%` | lilás (ícone agenda) |

Dark mode existe nos tokens (`.dark`) mas a landing foi desenhada em **light mode**.

### Raios (elevation.css)
- `--radius` base `0.8rem`; `--radius-sm` ~7px (badges/inputs), `--radius-md` ~10px (botões), `--radius-lg` ~13px (cards), `--radius-xl` ~19px (cards grandes/dialogs), `--radius-full` pill/avatar.

### Sombras
- `--shadow-xs`, `--shadow-card` (cards padrão), `--shadow-lg` (cards em destaque, painel demo). Tom verde-frio, não preto puro. Valores exatos em `design-tokens/elevation.css`.

### Motion
- `--ease-standard: cubic-bezier(0.32, 0.08, 0.24, 1)`; durações 120/200/320ms. Animação discreta: fades e translações curtas, **sem bounce**. Respeitar `prefers-reduced-motion`.

### Espaçamento
- Base 4px. Padding de card 24px, gutters 16px. **Alvos de toque ≥ 44px** (público inclui idosos/leigos) — requisito de acessibilidade, não enfeite.

## Tom de voz / Copy
- 100% **pt-BR**. Sentence case em botões e labels ("Falar no WhatsApp", não "Falar No WhatsApp").
- Moeda `R$ 1.234,56`; datas `dd/mm/aaaa`.
- Cordial, calmo, direto. **Sem emoji.** Ícones só do set **lucide-react** (traço 1.5–2px).
- No protótipo os ícones são SVGs lucide inline; ao implementar, use `lucide-react`.

## Layout Global
- Container central: `max-width: 1200px`, padding lateral 24px (classe `.sf-wrap`).
- **Header sticky** (68px): logo "Sistema Flores" (Fraunces) + marca gráfica (ícone de flor lucide em quadrado verde 34px, radius-md), nav (Funcionalidades, Módulos, Como funciona, Planos, Dúvidas) e CTA "Falar no WhatsApp" (44px, verde primary). Fundo com `backdrop-filter: blur(10px)` e `background: hsl(var(--background)/.82)`, borda inferior.
- Breakpoint mobile em **900px**: heros e grids colapsam para 1 coluna (classes `.sf-hero-grid`, `.sf-2col`, `.sf-3col`, `.sf-price-grid`, `.sf-modrow` viram 1 col; nav some via `.sf-hide-sm`; H1 cai para 40px via `.sf-h1`).

## Screens / Views (Seções, em ordem)

### 1. Hero (3 variantes — escolher UMA para produção)
Prop `heroVariant` alterna entre três layouts. **Recomendado: `painel`** (mais completo). As outras são alternativas de teste A/B.
- **A — `painel`**: grid 1.05fr / .95fr. Esquerda: badge "Para floriculturas e decoradores de eventos", H1 serif 56px "Do orçamento ao caixa, tudo em um só lugar.", parágrafo 19px, dois CTAs ("Falar com um especialista" clay + "Ver funcionalidades" outline), três selos com check (Sem instalação / Suporte em português / Cancele quando quiser). Direita: mock de **painel do app** (chrome com 3 dots, título "Painel · Hoje", 3 tiles de métrica — "A receber R$ 8.240", "Eventos 12", "Vendas mês R$ 21,9k" em verde primary com pulso —, e lista "Orçamentos recentes" com status badges). Números do painel **animam contando** na entrada.
- **B — `editorial`**: centralizado, eyebrow, H1 serif 64px "A sua floricultura, organizada com calma.", CTAs, e faixa de 4 métricas (5 min / 1 tela / 0 planilhas / 7 dias).
- **C — `split`**: 50/50. Esquerda texto ("Menos planilha, mais flores."). Direita card verde com gradiente (primary → 160 40% 20%) com depoimento + 2 stats.
- Fundo do hero: gradiente radial sutil de `--accent` no canto superior direito + dois "blobs" circulares flutuantes (animação `sfFloat` 9–11s) de baixa opacidade (primary e clay). Puramente decorativos, `pointer-events:none`.

### 2. Faixa de prova social
Faixa fina (borda topo/baixo, fundo `card/.5`): ícone estrela clay + "**Floriculturas e decoradores** confiam no Sistema Flores no dia a dia".

### 3. Funcionalidades (grid 3×2, 6 cards)
Eyebrow "Tudo que a floricultura precisa" + H2 serif 42px "Um módulo para cada parte do seu negócio". Cards brancos (radius-lg, shadow-card, padding 26px), cada um com ícone lucide 22px em quadrado 46px colorido (bg tonal + fg da cor), título 19px semibold, descrição 15px muted. Hover: `translateY(-3px)` + shadow-lg. Os 6 módulos:
1. **Orçamentos rápidos** (ícone file-text, primary) — orçamentos por WhatsApp que viram venda.
2. **Vendas e balcão** (shopping-cart, clay) — balcão e eventos na mesma tela.
3. **Controle de estoque** (package, chart-3) — o que tem/acaba, alertas de perecível.
4. **Financeiro e caixa** (dollar-sign, success) — a pagar/receber, fluxo, fechamento.
5. **Agenda de eventos** (calendar-check, chart-5) — casamentos/aniversários/corporativos por data.
6. **Cadastro de clientes** (users, warning) — histórico, datas especiais, fidelização.

### 4. Demo "Veja funcionando" (mock interativo auto-rodando)
Eyebrow "Veja funcionando" + H2 "O sistema trabalhando por você". Card grande (max 880px, radius-xl, shadow-lg) simulando janela do navegador (`app.sistemaflores.com.br`) com **3 abas que trocam sozinhas a cada ~4,5s** (também clicáveis), com barra de progresso na aba ativa:
- **Orçamento**: itens surgindo em sequência, "Total do orçamento" contando até **R$ 1.480,00**, selo verde "Aprovado pelo cliente".
- **Venda**: "Registrar venda · Balcão", valor contando até R$ 340,00, toggle Pix/Cartão/Dinheiro (Pix ativo), confirmação "Venda registrada. Comprovante enviado ao cliente."
- **Financeiro**: gráfico de barras "Entradas da semana" (5 barras Seg–Sex subindo), "Saldo em caixa" R$ 12.750,00, "A receber" (success) / "A pagar" (destructive).
- **Comportamento de animação**: valores repousam no número final; opacidade nunca zera (piso ~0.4) para o conteúdo ser sempre legível; animação só dispara quando a página fica visível (`visibilitychange`), e é desligada em `prefers-reduced-motion`.

### 5. "Por dentro do Sistema Flores" (5 linhas alternadas — detalhe de funcionalidades)
Eyebrow "Funcionalidades em detalhe" + H2 "Por dentro do Sistema Flores". Cada linha é um grid 2 colunas (texto / mock), alternando o lado do mock (linhas ímpares mock à direita; pares à esquerda via classe `.sf-rev` que inverte `order` no desktop). Texto: badge tonal, H3 serif 28px, parágrafo, 4 bullets com check verde. Mock: card branco radius-xl shadow-lg.
1. **Orçamentos & propostas** — "Orçamentos que viram venda sozinhos". Mock: proposta "Buquê corporativo" com itens, total R$ 612,00, badge "Aguardando", botão clay "Enviar por WhatsApp".
2. **Agenda & eventos** — "Nenhuma entrega esquecida". Mock: lista de eventos de Junho com chips de data (14 SÁB destacado primary, 18 QUA clay, 20 SEX).
3. **Estoque & compras** — "Saiba o que tem e o que falta". Mock: lista de estoque com status (Em estoque / **Acabando** destacado warning) + alerta "1 item precisa de reposição".
4. **Clientes & relatórios** — "Clientes fiéis e decisões com números". Mock: ranking "Mais vendidos · Junho" com 4 barras de progresso (2 primary, 2 clay).
5. **Notas & pedidos** — "Nota e pedido emitidos em segundos". Mock: "Pedido de venda · #1042" (badge success "Emitido"), itens, total R$ 457,20, e faixa success com ícone file-check "**NF-e nº 000.128.457** · Autorizada · 05/07 às 13:42" + check circular.

### 6. Formação de preço (módulo INTERATIVO — diferencial-chave)
Faixa `secondary/.5`. Eyebrow "Formação de preço" + H2 "Saiba o custo exato. Defina o lucro que você quer." Card 2 colunas (max 940px, radius-xl, shadow-lg):
- **Esquerda (branca)** — "Composição do custo · Buquê de rosas": 4 itens em linhas (Rosas colombianas · 12un R$ 42,00 / Folhagens e complementos R$ 14,00 / Papel e embalagem R$ 9,50 / Mão de obra (montagem) R$ 18,00), e "**Custo total R$ 83,50**" em serif 28px.
- **Direita (verde primary)** — "Quanto de lucro você quer?": **segmented control** Percentual / Valor fixo (ativo = branco + shadow; inativo = texto `hsl(0 0% 100%/.82)` para contraste no verde). Slider (`--clay` como thumb no fundo escuro). Label de margem, "Lucro por unidade" e "**Preço de venda**" grande em serif 34px + "Lucro é X% do preço".
- **Cálculo**: `custoTotal = 83,50`. Modo percentual: `lucro = custoTotal × margem% / 100` (slider 0–200%, passo 5, default 60%). Modo valor fixo: `lucro = valor` (slider R$0–300, passo 5, default R$60). `preçoVenda = custoTotal + lucro`. `lucroPctVenda = round(lucro / preçoVenda × 100)`. Ex.: 60% → lucro R$ 50,10, preço R$ 133,60, 38% do preço.
- Legenda: "Defina a margem uma vez por tipo de produto e o sistema já sugere o preço de venda em cada orçamento."

### 7. Como funciona (4 passos)
Faixa `secondary/.5`. 4 cards numerados (1–4) em círculo verde: Fale com a gente → Configuramos com você → Sua equipe entra → Você acompanha tudo.

### 8. Depoimentos (3 cards)
"Floriculturas que respiram mais aliviadas". 3 cards com 5 estrelas clay, citação, avatar com iniciais (bg primary/clay/chart-3) + nome/negócio. (Conteúdo é **placeholder** — substituir por depoimentos reais.)

### 9. Planos (INTERATIVO — preço por nº de acessos)
Faixa `secondary/.5`. Eyebrow "Planos por número de acessos" + H2 "Pague pelo tamanho da sua equipe".
- **Calculadora**: card (max 560px) com slider 1–20 acessos. Preço: `total = 89 + (acessos − 1) × 39` (R$ 89 pelo 1º acesso + R$ 39 por acesso extra). Default 3 acessos. Mostra "A partir de R$ {total}/mês" + hint dinâmico.
- **3 faixas de plano**: Balcão (R$ 89, 1–2 acessos, outline "Começar"), **Floricultura** (R$ 167, 3–6 acessos, borda 2px primary, badge clay "Mais popular", CTA clay "Pedir proposta"), Rede (R$ 359, 7+ acessos, outline "Falar com vendas"). Cada um com lista de features (check). Nota: 7 dias grátis, sem fidelidade.
- ⚠️ **Valores são placeholder** — confirmar tabela real de preços.

### 10. FAQ (accordion)
"Perguntas frequentes". 6 itens expansíveis (só um aberto por vez; default o 1º aberto). Chevron gira 180° ao abrir. Perguntas: instalação, preço por acessos, serve para eventos, segurança dos dados, fidelidade, configuração inicial.

### 11. CTA final
Card verde full-width (gradiente primary → 160 40% 19%, radius-xl, shadow-lg) com blobs decorativos: H2 serif 44px "Vamos organizar a sua floricultura juntos?", parágrafo, CTA clay grande (56px) "Falar no WhatsApp agora", "Resposta no mesmo dia · Sem compromisso".

### 12. Rodapé
Grid 3 colunas: marca + descrição / links Produto / Contato (WhatsApp + e-mail `contato@sistemaflores.com.br`). Barra inferior com copyright.

## Interactions & Behavior
- **CTAs WhatsApp**: todos apontam para o mesmo link `wa.me` (prop `whatsappLink`), abrem em nova aba. **Trocar pelo número real** no formato `https://wa.me/55DDDNUMERO?text=...`.
- **Nav**: âncoras suaves para `#funcionalidades`, `#detalhes`, `#como-funciona`, `#planos`, `#faq`. (Considerar `scroll-behavior: smooth` no container, não `scrollIntoView` em JS que quebre o app.)
- **Hero painel**: contadores animam na entrada (rAF, easing cubic-out ~1,2s).
- **Demo**: auto-avança abas a cada 4,5s com barra de progresso; clique numa aba reinicia o ciclo; contadores/barras animam por aba (~1s). Pausa/repousa quando oculto; respeita reduced-motion.
- **Formação de preço**: toggle percentual/valor + slider recalculam preço/lucro em tempo real.
- **Planos**: slider de acessos recalcula o preço "a partir de".
- **FAQ**: clique alterna o item aberto (accordion de item único).
- **Reveal em scroll**: seções/cards entram com fade + translateY (classe `.sf-rv`, keyframe `sfIn` de opacity .4→1 / translateY 22px→0). No protótipo é `animation ... both` no load; **na implementação real, prefira IntersectionObserver** disparando ao entrar na viewport (evita animar tudo de uma vez em páginas longas). Desligar em `prefers-reduced-motion`.
- **Hover**: cards de feature sobem 3px; botões primary/clay escurecem ~5% (sem shrink); links mudam para primary.
- **Foco**: usar anel de foco duplo do token `--focus-ring` (acessibilidade — nunca remover outline sem substituto).

## State Management
Estado local da página (no protótipo, um único componente):
- `heroVariant`: 'painel' | 'editorial' | 'split' — em produção, fixar UMA (ou controlar por experimento A/B).
- `demoTab`: 0–2 (aba da demo), com timer de auto-avanço + progresso.
- `seats`: 1–20 (calculadora de planos).
- `openFaq`: índice do item aberto (−1 = nenhum).
- `precoMode`: 'pct' | 'val'; `margemPct` (default 60); `margemVal` (default 60).
- Animações (contadores/barras): valores derivados de um relógio rAF que só roda quando a aba está visível.
Sem data fetching — página estática/marketing. Único "backend": o link do WhatsApp.

## Design Tokens
Ver `design-tokens/` (arquivos CSS completos). Resumo nas tabelas acima: cores HSL, tipografia (Fraunces/Inter + escala), raios, sombras, motion, espaçamento.

## Assets
- **Ícones**: todos do set **lucide-react** (no protótipo, SVGs lucide inline). Reimplementar com o pacote `lucide-react`. Ícones usados: flower/sparkles (logo), check, file-text, shopping-cart, package, dollar-sign/banknote, calendar-check, users, chevron-down, star, alert-triangle, message-circle/whatsapp (glifo do WhatsApp é um SVG customizado, não lucide — manter), file-check.
- **Fontes**: Fraunces + Inter (Google Fonts / self-host). Ver `design-tokens/fonts.css`.
- **Logo**: não há marca gráfica oficial — renderizar "Sistema Flores" em Fraunces + o quadradinho de ícone. Não desenhar um logo novo.
- **Imagens**: nenhuma foto usada; todos os "mocks" são UI construída com CSS. Se quiser fotos de produto (tom quente/natural), entram em catálogo, não como decoração.
- **Conteúdo placeholder a substituir**: depoimentos, tabela de preços, número de WhatsApp, e-mail de contato, e os dados de exemplo dos mocks (custos do buquê, nºs de NF-e, etc.).

## Files
- `Landing Sistema Flores.dc.html` — protótipo completo da landing (Design Component; estilos inline + bloco `<style>` para keyframes/media queries; lógica de interação numa classe JS).
- `design-tokens/colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `fonts.css`, `base.css` — tokens do design system Sistema Flores (fonte da verdade para todos os valores visuais).
- `screenshots/` — capturas de referência de cada seção (light mode, desktop):
  - `01-hero.png` — hero (variante painel)
  - `02-funcionalidades.png` — grid de 6 módulos
  - `03-demo-veja-funcionando.png` — demo interativa (mock do app)
  - `04-modulos-detalhe-orcamentos-agenda.png` — linhas 1–2 do "Por dentro"
  - `05-modulos-detalhe-estoque-clientes.png` — linhas 3–4
  - `06-modulos-detalhe-notas-pedidos.png` — linha 5 (NF-e / pedido)
  - `07-formacao-de-preco.png` — módulo interativo de precificação
  - `08-como-funciona.png` — 4 passos
  - `09-depoimentos.png` — prova social
  - `10-planos.png` — calculadora + faixas de plano
  - `11-faq.png` — accordion
  - `12-cta-final.png` — CTA de fechamento + rodapé
